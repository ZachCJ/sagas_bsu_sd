import type { SubmitEvent } from "react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import type { MockRecord } from "../mock/recordStore";
import { getGuestId } from "../mock/guest";
import { getRecord, isOwner, updateRecordLocation } from "../mock/recordStore";

/**
 * Stub record page. Shows the name and address. Only the guest who created
 * the record sees the control for adding or changing its location.
 *
 * @returns
 */
export default function RecordPage() {
  //Takes the id from URL.
  const { id = "" } = useParams();

  //Loads the record once, when the page first appears.
  const [record, setRecord] = useState<MockRecord | undefined>(() =>
    getRecord(id),
  );

  //tracks whether edit form is open. starts closed.
  const [editing, setEditing] = useState(false);
  //holds text in the edit box.
  const [address, setAddress] = useState(record?.address ?? "");
  const [error, setError] = useState("");

  //Check in case record is not found.
  if (!record) {
    return (
      <main>
        <h1>Record not found</h1>
        <Link to="/">Back to the map</Link>
      </main>
    );
  }

  //True when record coutnriutorID equals the browsers guest id.
  // Only decides whether edit button appears.
  const owner = isOwner(record, getGuestId());

  /**
   * Saves the address typed in the edit form, then closes the form.
   *
   * The store checks again that this browser's guest id owns the record, so
   * hiding the button is not the only protection. If it refuses, an error is
   * shown and nothing changes. A blank address removes the record's location.
   * Ownership here is a stub: the real check belongs in capture-api.
   *
   * @param event - The form's submit event. Its default action, reloading the page, is cancelled so the app keeps its state.
   */
  function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    //Aksks store to save address. Store checks ownership again itself. hiding button not only protection.
    const result = updateRecordLocation(id, address, getGuestId());
    if (!result.ok) {
      setError("You can only change the location of your own records.");
      return;
    }

    //Shows updated record
    setRecord(result.record);
    setError("");
    setEditing(false);
  }

  return (
    <main>
      <h1>{record.name}</h1>
      <p>Location: {record.address ?? "No location given."}</p>
      <p>This record page is a placeholder.</p>

      {owner && !editing && (
        <button type="button" onClick={() => setEditing(true)}>
          {record.address ? "Edit location" : "Add location"}
        </button>
      )}
      {owner && editing && (
        <form onSubmit={handleSave}>
          <label htmlFor="edit-address">Address</label>
          <br />
          <input
            id="edit-address"
            value={address}
            onChange={(event) => setAddress(event.currentTarget.value)}
          />
          <button type="submit">Save location</button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}

      <p>
        <Link to="/">Back to the map</Link> · <Link to="/search">Search</Link>
      </p>
    </main>
  );
}
