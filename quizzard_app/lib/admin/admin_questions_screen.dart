import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config.dart';

/// Content admin — MongoDB is the single source of truth (served by the Node
/// backend). This panel exposes the backend's content tools; the old Firestore
/// category/question CRUD has been retired.
class AdminQuestionsScreen extends StatefulWidget {
  const AdminQuestionsScreen({super.key});

  @override
  State<AdminQuestionsScreen> createState() => _AdminQuestionsScreenState();
}

class _AdminQuestionsScreenState extends State<AdminQuestionsScreen> {
  bool _busy = false;
  String? _status;
  List<String> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await http.get(Uri.parse('$kApiBaseUrl/api/categories'));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final names = (data['categories'] as List<dynamic>? ?? [])
            .map((e) => (e is Map ? e['name'] : e).toString())
            .toList();
        if (mounted) setState(() => _categories = names);
      }
    } catch (_) {}
  }

  Future<void> _post(String path, String label) async {
    setState(() {
      _busy = true;
      _status = 'Running $label…';
    });
    try {
      final res = await http.post(Uri.parse('$kApiBaseUrl$path'));
      setState(() => _status = '$label → HTTP ${res.statusCode}: ${res.body}');
    } catch (e) {
      setState(() => _status = '$label failed: $e');
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        _loadCategories();
      }
    }
  }

  Future<void> _uploadEntitiesCsv() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) return;
    setState(() {
      _busy = true;
      _status = 'Uploading ${file.name}…';
    });
    try {
      final request = http.MultipartRequest('POST', Uri.parse('$kApiBaseUrl/admin/entities/upload'));
      request.files.add(http.MultipartFile.fromBytes('file', bytes, filename: file.name));
      final streamed = await request.send();
      final body = await streamed.stream.bytesToString();
      setState(() => _status = 'Upload → HTTP ${streamed.statusCode}: $body');
    } catch (e) {
      setState(() => _status = 'Upload failed: $e');
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        _loadCategories();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Content lives in MongoDB', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 6),
                const Text(
                  'Questions are served by the backend and generated from entities/templates '
                  'or curated seed scripts. These tools call the backend directly.',
                ),
                const SizedBox(height: 16),
                if (_busy) const LinearProgressIndicator(),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _busy ? null : _uploadEntitiesCsv,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Upload entities CSV'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => _post('/admin/templates/seed', 'Seed templates'),
                      icon: const Icon(Icons.dataset),
                      label: const Text('Seed templates'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => _post('/admin/entities/seed', 'Seed Countries'),
                      icon: const Icon(Icons.public),
                      label: const Text('Seed Countries'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _busy ? null : () => _post('/admin/seed-all', 'Regenerate all'),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Regenerate all'),
                    ),
                  ],
                ),
                if (_status != null) ...[
                  const SizedBox(height: 14),
                  Text(_status!, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Live categories (${_categories.length})',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (_categories.isEmpty)
                  const Text('No categories — is the backend running?')
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _categories
                        .map((c) => Chip(label: Text(c)))
                        .toList(),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
