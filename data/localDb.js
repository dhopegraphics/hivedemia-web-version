import * as SQLite from 'expo-sqlite';

export const coursesDb = SQLite.openDatabaseAsync('courses.db');

export const notesTakenDb = SQLite.openDatabaseAsync('notes.db');

export const plannerDb = SQLite.openDatabaseAsync('planner.db');

export const smartHiveDb = SQLite.openDatabaseAsync('smartHiveChat.db');

export const smartHiveSnapToSolveDb = SQLite.openDatabaseAsync('smartHiveSnapToSolve.db');
export const groupsDb = SQLite.openDatabaseAsync('groups.db');

export const quizzesDb = SQLite.openDatabaseAsync('quizzes.db');

export const examsDb = SQLite.openDatabaseAsync('examsHub.db');

export const competitionsDb = SQLite.openDatabaseAsync('competition.db');