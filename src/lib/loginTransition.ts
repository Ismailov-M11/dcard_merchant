// Synchronous flag — set BEFORE React processes the state update,
// read during App render to keep LoginPage mounted while animating.
let _loginActive  = false;
let _logoutActive = false;

export const startLoginTransition  = () => { _loginActive  = true;  };
export const endLoginTransition    = () => { _loginActive  = false; };
export const isLoginTransition     = () => _loginActive;

export const startLogoutTransition = () => { _logoutActive = true;  };
export const endLogoutTransition   = () => { _logoutActive = false; };
export const isLogoutTransition    = () => _logoutActive;
