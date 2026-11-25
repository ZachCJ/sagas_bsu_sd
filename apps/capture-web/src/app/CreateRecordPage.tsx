import type { SubmitEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { createRecord } from "../mock/recordStore";

/**
 * Function that creates a stub page for starting a record. Only a name and an address for now.
 *
 * @returns The "Add a record" form, shown at `/records/new`.
 */
export default function CreateRecordPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(""); //lets componet remmber values between renders.
  const [address, setAddress] = useState(""); //Gives navigation links without a full page
  const [error, setError] = useState("");

  /**
   * Saves the record when the form is submitted, then opens its page.
   *
   * A name is required, so an empty or spaces-only name shows an error and
   * nothing is saved. The address is optional. If saving fails, the reason is
   * shown on the form rather than the button silently doing nothing
   *
   * @param event - The form's submit event. Its default action, reloading the  page, is cancelled so the app keeps its state.
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    //Stops browser default behavior for forms. i. e. refreshing the page.
    event.preventDefault();
    //Removes surrounding spaces.
    if (!name.trim()) {
      setError("Please give the record a name.");
      return;
    }
    try {
      //Saves a record. It comes from mock store, which is a place that will change when capture-api is ready.
      //Store attaches guest id, generated id and timestamp. Stores a blank address as no address
      const record = createRecord({ name, address });

      //Redirect that takes you to the newly created records page.
      void navigate(`/records/${record.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not save the record: ${err.message}`
          : "Could not save the record.",
      );
    }
  }

  return (
    <main>
      <h1>Add a record</h1>
      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="record-name">Name</label>
          <br />
          <input
            id="record-name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </p>
        <p>
          <label htmlFor="record-address">Address (optional)</label>
          <br />
          <input
            id="record-address"
            value={address}
            onChange={(event) => setAddress(event.currentTarget.value)}
          />
        </p>
        <button type="submit">Create record</button>
        {error && <p role="alert">{error}</p>}
      </form>
      <p>
        <Link to="/">Back to the map</Link>
      </p>
    </main>
  );
}
