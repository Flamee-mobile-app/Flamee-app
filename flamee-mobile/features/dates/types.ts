export type DateDay = {
  id: string;
  label: string;
  date: string;
  active: boolean;
};

export type DateIdea = {
  id: string;
  title: string;
  location: string;
  time: string;
  imageLabel: string;
};

export type DateSchedule = {
  week: DateDay[];
  upcoming: DateIdea;
  ideas: DateIdea[];
};
