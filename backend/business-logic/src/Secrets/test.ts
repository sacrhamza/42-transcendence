class MemoryStore {
  // Object stored in memory
  private static data: Record <string, string> = {}  // hna static kandiroha bach jmi3 les object ikono ando nafs data

  // Save an object
  static setData(values: Record<string, string>): void {
    MemoryStore.data = { ...values };
  }

  // Read one value
  static getData(key: string): string | undefined {
    return MemoryStore.data[key];
  }
}

// STEP 1: Create an object
const myData: Record<string, string> = {
  username: 'ayoub',
  language: 'TypeScript',
  framework: 'NestJS',
};

// STEP 2: Store the object in memory
MemoryStore.setData(myData);


// STEP 3: Read values
console.log(MemoryStore.getData('username'));
console.log(MemoryStore.getData('language'));
