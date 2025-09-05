import { colors } from "./Colors";


 // Get color based on position
 export  const getPositionColor = (position , isDark) => {
    switch (position) {
      case 1:
        return colors.success;
      case 2:
        return colors.warning;
      case 3:
        return colors.primary;
      default:
        return isDark ? colors.offwhite : colors.dark;
    }
  };

  // Get medal icon based on position
 export  const getMedalIcon = (position) => {
    switch (position) {
      case 1:
        return "medal";
      case 2:
        return "medal-outline";
      case 3:
        return "podium";
      default:
        return "flag-checkered";
    }
  };