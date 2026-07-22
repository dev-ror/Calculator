function activeDefinitions(rateRule) {
  return (rateRule.rates ?? [])
    .filter((definition) => String(definition.status).toUpperCase() === "ACTIVE")
    .sort((left, right) => left.position - right.position);
}

export function generate(matchedRateRules = []) {
  if (!Array.isArray(matchedRateRules)) {
    throw new TypeError("Matched rate rules must be an array");
  }

  return [...matchedRateRules]
    .sort((left, right) => left.priority - right.priority)
    .flatMap((rateRule) =>
      activeDefinitions(rateRule).map((definition) => ({
        ...definition,
        rule: {
          id: rateRule.id,
          name: rateRule.name,
          priority: rateRule.priority,
          exclusivity: rateRule.exclusivity,
        },
      })),
    );
}
