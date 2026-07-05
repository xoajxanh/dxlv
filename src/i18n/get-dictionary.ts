 

const dictionaries = {
  en: () => import("../dictionaries/en.json").then((module) => module.default),
  vi: () => import("../dictionaries/vi.json").then((module) => module.default),
};

export const getDictionary = async (locale: "en" | "vi") => {
  return dictionaries[locale]?.() ?? dictionaries.vi();
};
