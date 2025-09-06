import { BookOpen } from "lucide-react";
import { ICON_COMPONENTS } from "./constants";

export const getIconComponent = (iconName: string) => {
  return ICON_COMPONENTS[iconName as keyof typeof ICON_COMPONENTS] || BookOpen;
};

export const generateMockCourses = () => {
  return [
    {
      id: "1",
      title: "Advanced Mathematics",
      code: "MATH 301",
      professor: "Dr. Smith",
      description: "Calculus and Linear Algebra",
      icon: "Calculator",
      color: "#00df82",
      documentsCount: 24,
      lastUpdated: "2 days ago",
    },
    {
      id: "2",
      title: "Computer Science Fundamentals",
      code: "CS 101",
      professor: "Prof. Johnson",
      description: "Introduction to Programming",
      icon: "Code",
      color: "#8b5cf6",
      documentsCount: 18,
      lastUpdated: "1 week ago",
    },
    {
      id: "3",
      title: "Biology Laboratory",
      code: "BIO 205",
      professor: "Dr. Wilson",
      description: "Molecular Biology Lab",
      icon: "Microscope",
      color: "#10b981",
      documentsCount: 12,
      lastUpdated: "3 days ago",
    },
  ];
};
