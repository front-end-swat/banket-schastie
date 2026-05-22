document.addEventListener('DOMContentLoaded', () => {
  const viewerContainer = document.getElementById('panorama');
  const buttons = document.querySelectorAll('.tour__btn');

  if (!viewerContainer) return;

  const panoramas = {
    hall: 'images/panorama/hall.jpg',
    lobby: 'images/panorama/lobby.jpg',
    stage: 'images/panorama/stage.jpg',
  };

  const captions = {
    hall: 'Главный зал',
    lobby: 'Лобби',
    stage: 'Сцена',
  };

  const viewer = new PhotoSphereViewer.Viewer({
    container: viewerContainer,
    panorama: panoramas.hall,
    caption: captions.hall,
    loadingImg: 'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/assets/loading.svg',
    touchmoveTwoFingers: true,
    mousewheel: true,
    defaultZoomLvl: 50,
    autorotateDelay: 3000,
    navbar: [
      'zoom',
      'move',
      'fullscreen',
      {
        id: 'autorotate',
        title: 'Автовращение',
        type: 'toggle',
        active: true,
        className: 'psv-button--hover-scale',
        content: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>',
        active: true,
      },
      {
        id: 'reset',
        title: 'Сбросить вид',
        type: 'button',
        className: 'psv-button--hover-scale',
        content: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 5c-3.87 0-7 3.13-7 7h2c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5c-1.13 0-2.16-.37-3-1l1-1-4 2 4 4 1-1c1.16 1.16 2.75 2 4.5 2 3.87 0 7-3.13 7-7s-3.13-7-7-7z"/></svg>',
        onClick: () => viewer.animate({
          zoom: 100,
          yaw: 0,
          pitch: 0,
          speed: 1000,
        }),
      },
    ],
  });

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pano = btn.dataset.pano;
      if (!pano || !panoramas[pano]) return;

      buttons.forEach(b => b.classList.remove('tour__btn--active'));
      btn.classList.add('tour__btn--active');

      viewer.setPanorama(panoramas[pano], {
        caption: captions[pano] || pano,
        showLoader: true,
      });
    });
  });
});
