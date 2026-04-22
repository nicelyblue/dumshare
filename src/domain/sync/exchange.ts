import type { AppendEventInput, EventRepository, StoredEvent } from "../events/repository";

import type { SyncSessionDescriptor } from "./types";

export type RunBidirectionalSyncExchangeInput = {
  repository: EventRepository;
  session: SyncSessionDescriptor;
  remoteEvents: StoredEvent[];
};

export type SyncExchangeResult = {
  upload: {
    events: StoredEvent[];
    eventIds: string[];
  };
  download: {
    events: StoredEvent[];
    eventIds: string[];
  };
  appliedRemoteEventIds: string[];
  statusTimeline: string[];
};

function toAppendInput(event: StoredEvent): AppendEventInput {
  return {
    id: event.id,
    ledgerId: event.ledgerId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    occurredAt: event.occurredAt,
    actorDeviceId: event.actorDeviceId,
    payloadJson: event.payloadJson,
  };
}

export async function runBidirectionalSyncExchange(
  input: RunBidirectionalSyncExchangeInput,
): Promise<SyncExchangeResult> {
  const { repository, session, remoteEvents } = input;
  const statusTimeline = ["QR request scanned"];

  const organizerCheckpoint = await repository.getSyncCheckpoint(session.contributorDeviceId);
  const uploadEvents = remoteEvents
    .filter((event) => event.ledgerId === session.ledgerId && event.sequence > organizerCheckpoint)
    .sort((left, right) => left.sequence - right.sequence);

  statusTimeline.push(`Sending ${uploadEvents.length} changes`);

  const localEvents = await repository.listEventsByLedger(session.ledgerId);
  const localEventIds = new Set(localEvents.map((event) => event.id));

  const appliedRemoteEventIds: string[] = [];
  for (const remoteEvent of uploadEvents) {
    if (localEventIds.has(remoteEvent.id)) {
      continue;
    }

    await repository.appendEvent(toAppendInput(remoteEvent));
    localEventIds.add(remoteEvent.id);
    appliedRemoteEventIds.push(remoteEvent.id);
  }

  const downloadEvents = (
    await repository.listEventsAfterSequence(
      session.ledgerId,
      session.contributorCheckpoint,
    )
  ).filter((event) => event.actorDeviceId !== session.contributorDeviceId);

  statusTimeline.push(`Receiving ${downloadEvents.length} changes`);

  const maxUploadSequence = uploadEvents.reduce(
    (maxValue, event) => Math.max(maxValue, event.sequence),
    organizerCheckpoint,
  );
  await repository.setSyncCheckpoint(session.contributorDeviceId, maxUploadSequence);

  statusTimeline.push("Sync complete");

  return {
    upload: {
      events: uploadEvents,
      eventIds: uploadEvents.map((event) => event.id),
    },
    download: {
      events: downloadEvents,
      eventIds: downloadEvents.map((event) => event.id),
    },
    appliedRemoteEventIds,
    statusTimeline,
  };
}
