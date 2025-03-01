/**
 * Service Container
 * 
 * A simple service container for dependency injection and management.
 * This allows for services to be easily mocked for testing and
 * reduces direct dependencies between components.
 */
export class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Set<string>();

  /**
   * Register a service instance
   * @param name The service name
   * @param instance The service instance
   */
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Register a factory function that will create a service instance
   * @param name The service name
   * @param factory A factory function that returns a service instance
   * @param singleton Whether to create only one instance (true) or a new instance each time (false)
   */
  registerFactory<T>(name: string, factory: () => T, singleton = true): void {
    this.factories.set(name, factory);
    if (singleton) {
      this.singletons.add(name);
    }
  }

  /**
   * Get a service by name
   * @param name The service name
   * @returns The service instance
   * @throws Error if the service is not registered
   */
  get<T>(name: string): T {
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Check if we have a factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const instance = factory();

      // Cache the instance if it's a singleton
      if (this.singletons.has(name)) {
        this.services.set(name, instance);
      }

      return instance as T;
    }

    throw new Error(`Service ${name} not registered`);
  }

  /**
   * Check if a service is registered
   * @param name The service name
   * @returns True if the service is registered, false otherwise
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Remove a service
   * @param name The service name
   */
  remove(name: string): void {
    this.services.delete(name);
    this.factories.delete(name);
    this.singletons.delete(name);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
} 