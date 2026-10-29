import { MockStorage } from './mock-storage';

/**
 * Shared singleton instance of MockStorage. 
 *  Need to use this across all API endpoints for consistency of the system. 
 *  To import do: import { mockStorage } from './mock-storage/index'
 *  import * from './mock-storage/types'
 */
export const mockStorage = new MockStorage();
