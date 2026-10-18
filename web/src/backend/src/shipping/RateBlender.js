function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function tags(rate) {
  return String(rate.tags ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function pick(rates, mode) {
  return [...rates].sort((left, right) => {
    const difference = Number(left.price) - Number(right.price);
    return mode === "highest" ? -difference : difference;
  })[0];
}

function add(rates, override = {}) {
  const first = rates[0];
  return {
    ...first,
    ...override,
    id: `blend-${rates.map((rate) => rate.id).join("-")}`,
    price: rates.reduce((total, rate) => total + Number(rate.price ?? 0), 0),
  };
}

function applyAdvanced(rates, rules) {
  const remaining = [...rates];
  const output = [];
  for (const rule of Array.isArray(rules) ? rules : []) {
    const expected = String(rule.tags ?? "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    if (!expected.length) continue;
    const matched = remaining.filter((rate) => tags(rate).some((tag) => expected.includes(tag)));
    if (matched.length < 2) continue;
    matched.forEach((rate) => remaining.splice(remaining.indexOf(rate), 1));
    const mode = ["lowest", "highest"].includes(rule.blendType) ? rule.blendType : "add";
    if (mode === "add") {
      output.push(add(matched, {
        ...(rule.rateName ? { name: rule.rateName } : {}),
        ...(rule.description ? { description: rule.description } : {}),
        ...(rule.deliveryMin !== "" ? { minimumDays: numeric(rule.deliveryMin) } : {}),
        ...(rule.deliveryMax !== "" ? { maximumDays: numeric(rule.deliveryMax) } : {}),
      }));
    } else output.push(pick(matched, mode));
  }
  return [...remaining, ...output];
}

function limitFor(name, limits) {
  return (Array.isArray(limits) ? limits : []).find(
    (limit) => String(limit.name ?? "").trim().toLowerCase() === String(name).trim().toLowerCase(),
  );
}

export function blendRates(rates, configuration = {}) {
  if (!Array.isArray(rates) || rates.length < 2) return rates;
  const advanced = applyAdvanced(rates, configuration.advancedBlendRules);
  const groups = new Map();
  advanced.forEach((rate) => {
    const key = String(rate.name ?? "").trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), rate]);
  });
  const mode = ["lowest", "highest"].includes(configuration.blendMode)
    ? configuration.blendMode
    : "add";
  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];
    if (mode !== "add") return pick(group, mode);
    const blended = add(group);
    const limit = limitFor(blended.name, configuration.basicBlendLimits);
    const minimum = numeric(limit?.min);
    const maximum = numeric(limit?.max);
    if (minimum !== null) blended.price = Math.max(blended.price, minimum);
    if (maximum !== null) blended.price = Math.min(blended.price, maximum);
    return blended;
  });
}
