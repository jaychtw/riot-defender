import { LOUVRE_CHAPTER } from './louvre.js';

// Register future chapters here. v1.0 intentionally exposes only the Louvre.
export const CHAPTERS = Object.freeze({louvre: LOUVRE_CHAPTER});
export const ACTIVE_CHAPTER = CHAPTERS.louvre;
