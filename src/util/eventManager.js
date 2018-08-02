const eventManager = {
  eventList: new Map(),
  on(event, callback) {
    // console.log ("event: ", event);
    // console.log ("CALLBACK: ", callback);
    this.eventList.has(event) || this.eventList.set(event, new Set());
    this.eventList.get(event).add(callback);

    return () => this.eventList.get(event).delete(callback);
  },
  emit(event, ...args) {
    if (!this.eventList.has(event)) {
      console.log ("eventList: ", this.eventList);
      console.warn(
        `<${event}> Event is not registered. Did you forgot to bind the event ?`
      );
      return false;
    }
    this.eventList.get(event).forEach(cb => cb.call(this, ...args));

    return true;
  }
};

export default eventManager;
