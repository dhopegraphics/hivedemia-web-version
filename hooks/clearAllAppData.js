// Clear all localStorage and sessionStorage for web
export async function clearAllAppData() {
  try {
    // 1. Clear localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    // 2. Clear sessionStorage
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    // 3. Clear IndexedDB (for cached data)
    if (typeof indexedDB !== "undefined") {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map((db) => {
            return new Promise((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          })
        );
      } catch (error) {
        console.warn("Failed to clear IndexedDB:", error);
      }
    }

    console.log("All app data cleared successfully");
  } catch (error) {
    console.error("Error clearing app data:", error);
    throw error;
  }
}
