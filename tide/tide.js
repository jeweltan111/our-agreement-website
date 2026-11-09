(() => {
    const hour = new Date().getHours();
    const phase = hour >= 5 && hour < 11 ? 'morning'
        : hour >= 11 && hour < 18 ? 'day' : 'night';
    const labels = { morning: '晨潮 · MORNING', day: '午潮 · DAYLIGHT', night: '夜潮 · NIGHTFALL' };
    document.documentElement.dataset.tide = phase;
    document.querySelector('[data-tide-label]').textContent = labels[phase];

    // The existing application owns screen navigation and authentication.
    const focusAfterClick = (button, target) => {
        document.getElementById(button).addEventListener('click', () => {
            document.getElementById(target).focus({ preventScroll: true });
        });
    };
    focusAfterClick('startBtn', 'showLoginBtn');
    focusAfterClick('showLoginBtn', 'loginUsername');
    focusAfterClick('showRegisterBtn', 'registerUsername');
    focusAfterClick('backToAuthChoice1', 'showLoginBtn');
    focusAfterClick('backToAuthChoice2', 'showRegisterBtn');
    document.querySelector('#screen-auth [data-target="screen-intro"]').addEventListener('click', () => {
        document.getElementById('startBtn').focus({ preventScroll: true });
    });
})();
