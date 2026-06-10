import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../config.dart';

class AdminTemplatesScreen extends StatefulWidget {
  const AdminTemplatesScreen({super.key});

  @override
  State<AdminTemplatesScreen> createState() => _AdminTemplatesScreenState();
}

class _AdminTemplatesScreenState extends State<AdminTemplatesScreen> {
  static const String _baseUrl = kApiBaseUrl;
  bool _loading = false;
  List<dynamic> _templates = [];

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  Future<void> _loadTemplates() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(Uri.parse('$_baseUrl/admin/templates'));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        setState(() => _templates = (data['templates'] as List<dynamic>? ?? []));
      } else {
        _showSnack('Failed to load templates: ${res.body}');
      }
    } catch (e) {
      _showSnack('Template load error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createTemplate() async {
    final categoryController = TextEditingController();
    final targetCategoryController = TextEditingController();
    final templateController = TextEditingController();
    final attributeController = TextEditingController();
    String level = 'easy';

    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Template'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: categoryController,
                decoration: const InputDecoration(labelText: 'Category (Entity group)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: targetCategoryController,
                decoration: const InputDecoration(labelText: 'Target Category (optional)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: templateController,
                decoration: const InputDecoration(labelText: 'Template String (use {{name}})'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: attributeController,
                decoration: const InputDecoration(labelText: 'Attributes (comma separated)'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: level,
                decoration: const InputDecoration(labelText: 'Level'),
                items: const [
                  DropdownMenuItem(value: 'easy', child: Text('easy')),
                  DropdownMenuItem(value: 'medium', child: Text('medium')),
                  DropdownMenuItem(value: 'hard', child: Text('hard')),
                ],
                onChanged: (val) => level = val ?? 'easy',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
        ],
      ),
    );

    if (ok != true) return;

    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/admin/templates'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'category': categoryController.text.trim(),
          'targetCategory': targetCategoryController.text.trim(),
          'templateString': templateController.text.trim(),
          'attributeToTarget': attributeController.text.trim(),
          'level': level,
        }),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await _loadTemplates();
      } else {
        _showSnack('Create failed: ${res.body}');
      }
    } catch (e) {
      _showSnack('Create error: $e');
    }
  }

  Future<void> _deleteTemplate(String id) async {
    try {
      final res = await http.delete(Uri.parse('$_baseUrl/admin/templates/$id'));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await _loadTemplates();
      } else {
        _showSnack('Delete failed: ${res.body}');
      }
    } catch (e) {
      _showSnack('Delete error: $e');
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _seedDefaults() async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/admin/templates/seed'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'categories': ['Countries', 'Cricket', 'Football'],
        }),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await _loadTemplates();
        _showSnack('Default templates added.');
      } else {
        _showSnack('Seed failed: ${res.body}');
      }
    } catch (e) {
      _showSnack('Seed error: $e');
    }
  }

  Future<void> _seedCountriesEntities() async {
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/admin/entities/seed'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'category': 'Countries'}),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        _showSnack('Sample Countries entities added.');
      } else {
        _showSnack('Seed entities failed: ${res.body}');
      }
    } catch (e) {
      _showSnack('Seed entities error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _seedDefaults,
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Seed Defaults (Countries/Cricket/Football)'),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _seedCountriesEntities,
                icon: const Icon(Icons.public),
                label: const Text('Seed Countries Entities (sample data)'),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _templates.isEmpty
                    ? const Center(child: Text('No templates yet.'))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _templates.length,
                        separatorBuilder: (_, __) => const Divider(height: 24),
                        itemBuilder: (context, index) {
                          final t = _templates[index] as Map<String, dynamic>;
                          final rawAttributes = t['attributeToTarget'];
                          final attributes = rawAttributes is List
                              ? rawAttributes.join(', ')
                              : (rawAttributes?.toString() ?? '');
                          final targetCategory = (t['targetCategory'] as String?)?.trim() ?? '';
                          return ListTile(
                            title: Text(t['templateString'] ?? ''),
                            subtitle: Text(
                              '${t['category'] ?? ''} → ${targetCategory.isEmpty ? t['category'] ?? '' : targetCategory} '
                              '• ${t['level'] ?? ''} • $attributes',
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete),
                              onPressed: () => _deleteTemplate(t['_id'] ?? ''),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createTemplate,
        child: const Icon(Icons.add),
      ),
    );
  }
}
