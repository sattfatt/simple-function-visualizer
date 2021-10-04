/**
 * Adds a handler to a particular event
 * @param {string}} eventType Designates the type of event to handle
 * @param {function} handler Designates the handler function to handle that event
 */

 function on(eventType, handler) {
    document.addEventListener(eventType, handler);
}

/**
 * Removes handler from event
 * @param {string} eventType Designates the type of event to handle
 * @param {function} handler The handler to that event
 */
function off(eventType, handler) {
    document.removeEventListener(eventType, handler);
}

/**
 * Adds handler that handles the event once then unsubs
 * @param {string} eventType Designates the type of event to handle
 * @param {function} handler The handler to that event
 */
function once(eventType, handler) {
    on(eventType, handleOnce);
    function handleOnce(event) {
        handler(event);
        off(eventType, handleOnce);
    }
}

/**
 * triggers event in the document scope
 * @param {string} eventType The type of event to fire
 * @param {any} data Any data that you want the handler to process from the source.
 */
function trigger(eventType, data) {
    const event = new CustomEvent(eventType, {detail:data});
    document.dispatchEvent(event);
}

async function triggerAsync(eventType, data) {
    const event = new CustomEvent(eventType, {detail:data});
    document.dispatchEvent(event);
}

export {on, once, off, trigger, triggerAsync}