function labelFromAttribute(attributeKey) {
  if (!attributeKey) return "attribute";
  return attributeKey.replace(/_/g, " ");
}

function buildDefaultTemplatesForCategory(category, attributeKeys) {
  const keys = attributeKeys.length ? attributeKeys : ["attribute_1"];
  const templates = [];
  for (const key of keys) {
    const label = labelFromAttribute(key);
    templates.push(
      {
        category,
        targetCategory: category,
        templateString: `What is the ${label} of {{name}}?`,
        attributeToTarget: [key],
        level: "easy",
      },
      {
        category,
        targetCategory: category,
        templateString: `Which ${label} is associated with {{name}}?`,
        attributeToTarget: [key],
        level: "medium",
      },
      {
        category,
        targetCategory: category,
        templateString: `Identify the correct ${label} for {{name}}.`,
        attributeToTarget: [key],
        level: "hard",
      }
    );
  }
  return templates;
}

module.exports = {
  buildDefaultTemplatesForCategory,
};
