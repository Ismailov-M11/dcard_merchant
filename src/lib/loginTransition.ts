// Synchronous flag — set BEFORE React processes the state update,
// read during App render to keep LoginPage mounted while animating.
let _active = false;
export const startLoginTransition = () => { _active = true; };
export const endLoginTransition   = () => { _active = false; };
export const isLoginTransition    = () => _active;
