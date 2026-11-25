import type { SubmitEvent } from "react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { searchRecords } from "../mock/recordStore";

/**
 * Search by address. The query lives in the URL (`/search?q=...`) so a results
 * page can be reloaded or bookmarked.
 */
export default function SearchPage() {
  //Reads and chages part of URL after ?, the query string.
  const [params, setParams] = useSearchParams();

  // reads q from the URL. For /search?q=main it returns "main". It returns null if there's no q, and ?? ""
  // turns that into an empty string.
  const query = params.get("q") ?? "";

  //holds what's currently typed in the box. It starts as the URL's query, so the box is prefilled.
  const [text, setText] = useState(query);

  const trimmed = query.trim();

  //is the mock stores search function
  const results = trimmed ? searchRecords(trimmed) : [];

  /**
   *
   * @param event
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setParams(text.trim() ? { q: text.trim() } : {});
  }

  return (
    <main>
      <h1>Search by address</h1>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="search-text">Address</label>{" "}
        <input
          id="search-text"
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
        />{" "}
        <button type="submit">Search</button>
      </form>

      {!trimmed && <p>Type an address to search for records.</p>}
      {trimmed && results.length === 0 && <p>No records found.</p>}
      {results.length > 0 && (
        <ul>
          {results.map((record) => (
            <li key={record.id}>
              <Link to={`/records/${record.id}`}>{record.name}</Link>
              {" - "}
              {record.address}
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/">Back to the map</Link>
      </p>
    </main>
  );
}
