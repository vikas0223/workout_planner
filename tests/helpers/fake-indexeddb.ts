/**
 * In-Memory IndexedDB Mock for Vitest / Node environments
 * Faithfully implements object stores, compound indexes, transactions, and event lifecycles.
 */

export class MockIDBIndex {
  constructor(
    public name: string,
    public keyPath: string | string[],
    public options: IDBIndexParameters,
    private store: MockIDBObjectStore
  ) {}

  public getAll(query?: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const records: any[] = [];
      for (const value of this.store.data.values()) {
        if (Array.isArray(this.keyPath)) {
          const matches = this.keyPath.every((kp, idx) => {
            const val = this.getNestedProperty(value, kp);
            if (Array.isArray(query)) {
              return val === query[idx];
            }
            return true;
          });
          if (matches) records.push(value);
        } else {
          const val = this.getNestedProperty(value, this.keyPath);
          if (query === undefined || val === query) {
            records.push(value);
          }
        }
      }
      req.result = records;
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);
  }
}

export class MockIDBRequest {
  public result: any;
  public error: DOMException | null = null;
  public onsuccess: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
}

export class MockIDBObjectStore {
  public data = new Map<string, any>();
  public indexes = new Map<string, MockIDBIndex>();

  constructor(
    public name: string,
    public options: IDBObjectStoreParameters = { keyPath: 'id' }
  ) {}

  public createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): MockIDBIndex {
    const index = new MockIDBIndex(name, keyPath, options || {}, this);
    this.indexes.set(name, index);
    return index;
  }

  public index(name: string): MockIDBIndex {
    const index = this.indexes.get(name);
    if (!index) throw new Error(`Index not found: ${name}`);
    return index;
  }

  public get(key: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = this.data.get(String(key)) ?? null;
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  public put(value: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      const keyProp = typeof this.options.keyPath === 'string' ? this.options.keyPath : 'id';
      const key = value[keyProp];
      this.data.set(String(key), JSON.parse(JSON.stringify(value)));
      req.result = key;
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  public delete(key: any): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this.data.delete(String(key));
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  public getAll(): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = Array.from(this.data.values()).map((v) => JSON.parse(JSON.stringify(v)));
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  public count(): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = this.data.size;
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }

  public clear(): IDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      this.data.clear();
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }
}

export class MockIDBTransaction {
  public oncomplete: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public onabort: (() => void) | null = null;
  public error: DOMException | null = null;

  constructor(
    public storeNames: string[],
    public mode: IDBTransactionMode,
    private db: MockIDBDatabase
  ) {
    setTimeout(() => {
      this.oncomplete?.();
    }, 15);
  }

  public objectStore(name: string): MockIDBObjectStore {
    const store = this.db.stores.get(name);
    if (!store) throw new Error(`ObjectStore not found: ${name}`);
    return store;
  }

  public abort(): void {
    this.onabort?.();
  }
}

export class MockIDBDatabase {
  public stores = new Map<string, MockIDBObjectStore>();

  public get objectStoreNames(): { contains: (name: string) => boolean } {
    return {
      contains: (name: string) => this.stores.has(name),
    };
  }

  public createObjectStore(name: string, options?: IDBObjectStoreParameters): MockIDBObjectStore {
    const store = new MockIDBObjectStore(name, options);
    this.stores.set(name, store);
    return store;
  }

  public transaction(storeNames: string | string[], mode: IDBTransactionMode): MockIDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    return new MockIDBTransaction(names, mode, this);
  }

  public close(): void {
    // no-op
  }
}

export class MockIDBFactory {
  private dbInstance: MockIDBDatabase | null = null;

  public open(name: string, version: number): MockIDBRequest {
    const req = new MockIDBRequest();
    setTimeout(() => {
      if (!this.dbInstance) {
        this.dbInstance = new MockIDBDatabase();
      }
      // Trigger onupgradeneeded if first time
      const event = {
        target: { result: this.dbInstance },
      };
      (req as any).onupgradeneeded?.(event);

      req.result = this.dbInstance;
      req.onsuccess?.({ target: req } as any);
    }, 0);
    return req as any;
  }
}

export function setupMockIndexedDB(): MockIDBFactory {
  const factory = new MockIDBFactory();
  (globalThis as any).indexedDB = factory;
  return factory;
}
