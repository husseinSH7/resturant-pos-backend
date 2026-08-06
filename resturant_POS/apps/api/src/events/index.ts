import { EventEmitter } from 'events';

class RestaurantEventEmitter extends EventEmitter {
  private static instance: RestaurantEventEmitter;

  private constructor() {
    super();
  }

  static getInstance(): RestaurantEventEmitter {
    if (!RestaurantEventEmitter.instance) {
      RestaurantEventEmitter.instance = new RestaurantEventEmitter();
    }
    return RestaurantEventEmitter.instance;
  }
}

export const eventEmitter = RestaurantEventEmitter.getInstance();