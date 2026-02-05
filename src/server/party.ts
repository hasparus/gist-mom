import type * as Party from "partykit/server";
import { onConnect } from "y-partyserver";
import * as Y from "yjs";

export class PartyServer implements Party.Server {
  constructor(public party: Party.Party) {}

  async onConnect(conn: Party.Connection) {
    return onConnect(conn, this.party, {
      // a Y.Doc can be initialized with a string, which will be encoded as a Y.Text
      // so when the document is empty, we can initialize it with the gist content
      // ydoc.getText("monaco").insert(0, gistContent)
      // however, we don't have gist content yet, so we'll just use an empty doc
    });
  }
}
