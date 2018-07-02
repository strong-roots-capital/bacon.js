import UpdateBarrier from "./updatebarrier";
import { Desc, describe } from "./describe";
import { nop } from "./helpers";
import { EventSink, Sink, Transformer, Unsub, VoidSink } from "./types"
import Property from "./property"
import { StateF } from "./withstatemachine";
import { Equals } from "./skipduplicates";

var idCounter = 0;

export default abstract class Observable<V> {
  desc: Desc
  id: number = ++idCounter
  initialDesc: Desc
  _name?: string
  _isObservable = true

  constructor(desc: Desc) {
    this.desc = desc
    this.initialDesc = desc
  }

  subscribe(sink: EventSink<V> = nop): Unsub {
    return UpdateBarrier.wrappedSubscribe(this, sink => this.subscribeInternal(sink), sink)
  }

  abstract subscribeInternal(sink: EventSink<V>): Unsub

  onValue(f: Sink<V> = nop) : Unsub {
    return this.subscribe(function(event) {
      if (event.hasValue) { return f(event.value) }
    });
  }

  forEach(f: Sink<V> = nop) : Unsub {
    // TODO: inefficient alias. Also, similar assign alias missing.
    return this.onValue(f)
  }

  onValues(f): Unsub {
    return this.onValue(function(args) { return f(...args) });
  }

  onError(f: Sink<any> = nop): Unsub {
    return this.subscribe(function(event) {
      if (event.isError) { return f(event.error) }
    })
  }

  onEnd(f: VoidSink = nop): Unsub {
    return this.subscribe(function(event) {
      if (event.isEnd) { return f(); }
    });
  }

  abstract toProperty(): Property<V> 

  abstract transform<V2>(transformer: Transformer<V, V2>, desc?: Desc): Observable<V2>

  abstract withStateMachine<State,Out>(initState: State, f: StateF<V, State, Out>): Observable<Out>

  abstract take(count: number): Observable<V>

  abstract filter(f: ((V) => boolean) | boolean | Property<boolean>): Observable<V>

  abstract map<V2>(f: ((V) => V2) | Property<V2>): Observable<V2>

  abstract skipDuplicates(isEqual?: Equals<V>): Observable<V>

  name(name: string) {
    this._name = name;
    return this;
  }

  withDescription(context, method, ...args) {
    this.desc = describe(context, method, ...args);
    return this;
  }

  toString(): string {
    if (this._name) {
      return this._name;
    } else {
      return this.desc.toString();
    }
  }

  inspect() { return this.toString() }

  deps(): any[] {
    return this.desc.deps()
  }

  internalDeps(): any[] {
    return this.initialDesc.deps();
  }
}