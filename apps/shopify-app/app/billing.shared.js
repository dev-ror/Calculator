export function canUse(plan, feature) {
  const access = {
    sandbox: { rates: false, customizations: false, customCode: false },
    starter: { rates: false, customizations: true, customCode: false },
    pro: { rates: true, customizations: true, customCode: false },
    proplus: { rates: true, customizations: true, customCode: true },
  };
  return access[plan]?.[feature] === true;
}

export function planLabel(plan) {
  return {
    sandbox: "Sandbox / Test",
    starter: "Starter",
    pro: "Pro",
    proplus: "Pro+",
  }[plan] ?? "Sandbox / Test";
}
