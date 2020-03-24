import { normalizeSnapshot } from './snapshot-utils';

fin.Platform.init({
  overrideCallback: async (Provider) => {
      class Override extends Provider {

        async applySnapshot({ snapshot, options }) {
          return await super.applySnapshot({ 
            snapshot: await  normalizeSnapshot(snapshot), 
            options 
          });
        }

        quit(payload, identity) {
          (async () => {
            // saves snapshot to restore layout on a next launch
            // it's supposed that platform uses local storage 'user-snapshot'
            const snapshot = await this.getSnapshot();
            localStorage.setItem('user-snapshot', JSON.stringify(snapshot))
            super.quit(payload, identity);
          })();
        }
      }
      return new Override();
  }
});
