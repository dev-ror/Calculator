function normalizedType(type) {
  return String(type ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function methodValues(customization) {
  return [...(customization.methods ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((method) => String(method.value ?? "").trim().toLowerCase())
    .filter(Boolean);
}

function matchesMethod(rate, method) {
  return String(rate.name ?? "").toLowerCase().includes(method);
}

function matchesAnyMethod(rate, methods) {
  return methods.some((method) => matchesMethod(rate, method));
}

function uniqueRates(rates) {
  const seen = new Set();
  return rates.filter((rate) => {
    const key = rate.id ?? `${rate.rateRuleId}:${rate.position}:${rate.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function reorder(rates, methods) {
  const ranked = [];
  const remaining = [...rates];

  for (const method of methods) {
    for (let index = 0; index < remaining.length;) {
      if (matchesMethod(remaining[index], method)) {
        ranked.push(...remaining.splice(index, 1));
      } else {
        index += 1;
      }
    }
  }

  return [...ranked, ...remaining];
}

export function apply(rates = [], matchedCustomizations = []) {
  if (!Array.isArray(rates) || !Array.isArray(matchedCustomizations)) {
    throw new TypeError("Rates and matched customizations must be arrays");
  }

  let visibleRates = [...rates];
  let hiddenRates = [];
  let reorderedRates = [];
  const renamedRates = [];

  for (const customization of matchedCustomizations) {
    const methods = methodValues(customization);
    if (methods.length === 0) continue;

    switch (normalizedType(customization.type)) {
      case "hide": {
        const hidden = visibleRates.filter((rate) => matchesAnyMethod(rate, methods));
        hiddenRates = uniqueRates([...hiddenRates, ...hidden]);
        visibleRates = visibleRates.filter((rate) => !matchesAnyMethod(rate, methods));
        break;
      }
      case "show": {
        const restored = hiddenRates.filter((rate) => matchesAnyMethod(rate, methods));
        visibleRates = uniqueRates([...visibleRates, ...restored]);
        hiddenRates = hiddenRates.filter((rate) => !matchesAnyMethod(rate, methods));
        break;
      }
      case "only_show":
      case "onlyshow": {
        const hidden = visibleRates.filter((rate) => !matchesAnyMethod(rate, methods));
        hiddenRates = uniqueRates([...hiddenRates, ...hidden]);
        visibleRates = visibleRates.filter((rate) => matchesAnyMethod(rate, methods));
        break;
      }
      case "rename":
        renamedRates.push(...visibleRates.filter((rate) => matchesAnyMethod(rate, methods)));
        break;
      case "reorder":
        visibleRates = reorder(visibleRates, methods);
        reorderedRates = [...visibleRates];
        break;
      default:
        break;
    }
  }

  return {
    visibleRates,
    hiddenRates,
    renamedRates: uniqueRates(renamedRates),
    reorderedRates,
  };
}
