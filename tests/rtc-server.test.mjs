import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRtcServer} from '../teleconsult-server/server.mjs';
test('self-hosted signaling serves guest, config and IDs, but not peer discovery',async()=>{
 const {server}=createRtcServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{const config=await fetch(base+'/rtc-config.js');assert.equal(config.headers.get('cache-control'),'no-store');assert.match(await config.text(),/server:location.origin/);const guest=await fetch(base+'/teleconsulta.html');assert.equal(guest.status,200);assert.doesNotMatch(await guest.text(),/src="\/app.js/);const id=await fetch(base+'/peerjs/peerjs/id');assert.equal(id.status,200);assert.ok((await id.text()).length>10);const peers=await fetch(base+'/peerjs/peerjs/peers');assert.equal(peers.status,401);assert.equal((await fetch(base+'/not-found')).status,404)}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
