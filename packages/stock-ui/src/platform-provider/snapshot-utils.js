export async function normalizeSnapshot(snapshot) {  
  console.log('normalizeSnapshot');

  // keep layout only

  const appInfo = await fin.Application.getCurrentSync().getInfo();
  const initialOptions = appInfo.initialOptions;  
  const defaultSnapshot = initialOptions.snapshot;
  const defaultUuid = initialOptions.uuid;
  const defaultUrl = initialOptions.defaultWindowOptions.url;
  console.log(`Default uuid: ${defaultUuid}`);
  console.log(`Default url: ${defaultUrl}`);

  const defaultComponents = new Map();
  traverseSnapshotComponents(defaultSnapshot, component => {
    defaultComponents.set(component.name, component);    
  });

  let hasWindowsMatched = true;
  traverseSnapshotWindows(snapshot, window => {
    if (window.uuid !== defaultUuid) {
      hasWindowsMatched = false;
      return;
    }
    console.log(`window url: ${window.url} -> ${defaultUrl}`);    
    window.url = defaultUrl;
  });

  if (!hasWindowsMatched) {
    console.log("Use default snapshot because has no windows matched")
    return defaultSnapshot;
  }

  traverseSnapshotComponents(snapshot, component => {
    const defaultComponent = defaultComponents.get(component.name);
    console.log(`component url: ${component.url} -> ${defaultComponent.url}`);
    component.url = defaultComponent.url;    
  });

  return snapshot;
}

function traverseComponents(content, level, action) {
  console.log(`traverseComponents: level= ${level}, content type= ${content.type}`);
  if (level > 10) {
    return;
  }

  if (content.type === 'component') {
   const state = content.componentState;
   action(state);
   return;
  }

  const newContent = content.content;
  for (let i = 0; i < newContent.length; i++) {
   traverseComponents(newContent[i], level + 1, action);
  }
 }

 function traverseSnapshotWindows(snapshot, action) {
  const windows = snapshot.windows;
  for (let i = 0; i < windows.length; i++) {
   action(windows[i]);
  } 
 }

 function traverseSnapshotComponents(snapshot, action) {
  traverseSnapshotWindows(snapshot, window => {
    const layout = window.layout;
    traverseComponents(layout.content[0], 0, action); 
  });
 }
 