// ==UserScript==
// @name         YouTube Smooth Volume Fade
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Плавное повышение/понижение громкости при play/pause на YouTube и YouTube Music
// @author       mkdir_username
// @match        https://www.youtube.com/*
// @match        https://music.youtube.com/*
// @icon         https://img.icons8.com/?size=100&id=V1cbDThDpbRc&format=png&color=000000
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // === НАСТРОЙКИ ===
    const FADE_DURATION = 800; // Длительность fade в миллисекундах (можно изменить)
    const FADE_STEPS = 40; // Количество шагов анимации (чем больше, тем плавнее)
    const TARGET_VOLUME = 1.0; // Целевая громкость (от 0 до 1)

    let currentFadeInterval = null;
    let targetVolume = TARGET_VOLUME;

    function fadeVolume(video, startVolume, endVolume, duration) {
        if (currentFadeInterval) {
            clearInterval(currentFadeInterval);
        }

        const stepDuration = duration / FADE_STEPS;
        const volumeStep = (endVolume - startVolume) / FADE_STEPS;
        let currentStep = 0;

        currentFadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = startVolume + (volumeStep * currentStep);

            if (currentStep >= FADE_STEPS) {
                video.volume = endVolume;
                clearInterval(currentFadeInterval);
                currentFadeInterval = null;
            } else {
                video.volume = Math.max(0, Math.min(1, newVolume));
            }
        }, stepDuration);
    }

    function handlePlay(video) {
        // Запоминаем текущую громкость как целевую (если пользователь менял)
        if (!video.paused && video.volume > 0) {
            targetVolume = video.volume;
        }

        // Начинаем с тишины и плавно поднимаем
        const currentVolume = video.volume;
        video.volume = 0;
        fadeVolume(video, 0, targetVolume, FADE_DURATION);
    }

    function handlePause(video) {
        // Плавно опускаем до нуля
        const currentVolume = video.volume;
        fadeVolume(video, currentVolume, 0, FADE_DURATION);
    }

    function initVideo(video) {
        if (video.dataset.smoothFadeInit) return;
        video.dataset.smoothFadeInit = 'true';

        // Отслеживаем play
        video.addEventListener('play', () => handlePlay(video));

        // Отслеживаем pause
        video.addEventListener('pause', () => handlePause(video));

        // Сохраняем громкость при изменении пользователем
        video.addEventListener('volumechange', (e) => {
            if (!currentFadeInterval && !video.paused) {
                targetVolume = video.volume;
            }
        });

        console.log('✅ Smooth Volume Fade инициализирован для видео');
    }

    function findAndInitVideo() {
        const video = document.querySelector('video.html5-main-video, video.video-stream');
        if (video && !video.dataset.smoothFadeInit) {
            initVideo(video);
        }
    }

    // Ищем видео при загрузке
    findAndInitVideo();

    // Наблюдаем за изменениями DOM (для YouTube SPA навигации)
    const observer = new MutationObserver(() => {
        findAndInitVideo();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Дополнительная проверка через интервал (на случай если что-то пропустили)
    setInterval(findAndInitVideo, 2000);

})();
