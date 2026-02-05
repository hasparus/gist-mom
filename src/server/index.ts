import { PartyServer } from "./party";
import { createPartyRpc } from "partykit/server";

export default {
  async fetch(
    request: Request,
    env: { PARTYKIT_DEFAULTS: DurableObjectNamespace }
  ) {
    const party = createPartyRpc(env.PARTYKIT_DEFAULTS);
    return party.fetch(request);
  },
};

export { PartyServer };
