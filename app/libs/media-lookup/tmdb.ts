const key = process.env.TMDB_API_TOKEN ?? "";
const baseUrl = "https://api.themoviedb.org/3/search/multi";

export async function searchTMDB(title: string = "") {
  try {
    const params = new URLSearchParams([
      ["query", title],
      ["include_adult", "true"],
    ]);

    const response = await fetch(baseUrl + "?" + params, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();      
      return data.results;
    } else {
      console.error(`Error: ${response.status} - ${response.statusText}`)
    }
  } catch (error) {
    console.error(error);
  }
}
