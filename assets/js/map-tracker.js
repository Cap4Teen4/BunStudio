(function () {
    if (window.__mapTrackerBooted) {
        return;
    }

    window.__mapTrackerBooted = true;
    const stateId = 'map-tracker-state';
    const overlayId = 'map-tracker-overlay';
    const imageId = 'map-tracker-image';
    const emptyId = 'map-tracker-empty';
    const stageId = 'map-tracker-stage';
    const viewportId = 'map-tracker-viewport';
    const zoomInId = 'map-zoom-in';
    const zoomOutId = 'map-zoom-out';
    const zoomResetId = 'map-zoom-reset';
    const zoomLabelId = 'map-zoom-label';
    const zoomStep = 0.25;

    const zoomState = {
        scale: 1,
        minScale: 1,
        maxScale: 4,
        translateX: 0,
        translateY: 0,
        pointerId: null,
        lastX: 0,
        lastY: 0,
        moved: false,
    };

    function parseState() {
        const element = document.getElementById(stateId);

        if (!element) {
            return null;
        }

        try {
            return JSON.parse(element.textContent || '{}');
        } catch (error) {
            console.error('Map tracker state parsing failed', error);
            return null;
        }
    }

    function normalizePoints(points) {
        return (Array.isArray(points) ? points : []).filter(function (point) {
            return typeof point?.x === 'number' && typeof point?.y === 'number';
        });
    }

    function buildPoints(state) {
        const trail = normalizePoints(state?.trail);
        const currentPoint = state?.currentPoint && typeof state.currentPoint === 'object' ? state.currentPoint : null;

        if (!currentPoint || typeof currentPoint.x !== 'number' || typeof currentPoint.y !== 'number') {
            return trail;
        }

        return trail.concat([currentPoint]);
    }

    function getTrackedPlayers(state) {
        return (Array.isArray(state?.trackedPlayers) ? state.trackedPlayers : []).filter(function (player) {
            return player && typeof player === 'object';
        });
    }

    function buildTrackedPlayerPoints(player) {
        const trail = normalizePoints(player?.trail);
        const currentPoint = player?.currentPoint && typeof player.currentPoint === 'object' ? player.currentPoint : null;

        if (!currentPoint || typeof currentPoint.x !== 'number' || typeof currentPoint.y !== 'number') {
            return trail;
        }

        return trail.concat([currentPoint]);
    }

    function createSvgNode(name, attributes, textContent) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', name);

        Object.entries(attributes).forEach(function ([key, value]) {
            node.setAttribute(key, String(value));
        });

        if (typeof textContent === 'string') {
            node.textContent = textContent;
        }

        return node;
    }

    function toggleEmptyState(image, emptyState) {
        if (!image || !emptyState) {
            return;
        }

        const handleReady = function () {
            emptyState.style.display = 'none';
        };

        const handleError = function () {
            emptyState.style.display = 'grid';
        };

        if (!image.dataset.mapTrackerBound) {
            image.addEventListener('load', handleReady);
            image.addEventListener('error', handleError);
            image.dataset.mapTrackerBound = 'true';
        }

        if (image.complete && image.naturalWidth > 0) {
            handleReady();
            return;
        }

        if (image.complete) {
            handleError();
        }
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getStage() {
        return document.getElementById(stageId);
    }

    function getViewport() {
        return document.getElementById(viewportId);
    }

    function isSelectionMode(state) {
        return Boolean(state?.awaitingCalibration || state?.awaitingLandmarkPlacement);
    }

    function updateStageCursor(stage, state) {
        if (!stage) {
            return;
        }

        if (isSelectionMode(state)) {
            stage.style.cursor = 'crosshair';
            return;
        }

        if (zoomState.pointerId !== null) {
            stage.style.cursor = 'grabbing';
            return;
        }

        stage.style.cursor = zoomState.scale > 1 ? 'grab' : 'default';
    }

    function clampTranslation(stage) {
        if (!stage || zoomState.scale <= 1) {
            zoomState.translateX = 0;
            zoomState.translateY = 0;
            return;
        }

        const maxOffsetX = (stage.clientWidth * (zoomState.scale - 1)) / 2;
        const maxOffsetY = (stage.clientHeight * (zoomState.scale - 1)) / 2;

        zoomState.translateX = clamp(zoomState.translateX, -maxOffsetX, maxOffsetX);
        zoomState.translateY = clamp(zoomState.translateY, -maxOffsetY, maxOffsetY);
    }

    function applyViewportTransform() {
        const viewport = getViewport();
        const stage = getStage();
        const zoomLabel = document.getElementById(zoomLabelId);

        clampTranslation(stage);

        if (viewport) {
            viewport.style.transform = 'translate(' + zoomState.translateX + 'px, ' + zoomState.translateY + 'px) scale(' + zoomState.scale + ')';
        }

        if (zoomLabel) {
            zoomLabel.textContent = Math.round(zoomState.scale * 100) + '%';
        }

        updateStageCursor(stage, parseState());
    }

    function setZoom(nextScale) {
        zoomState.scale = clamp(nextScale, zoomState.minScale, zoomState.maxScale);

        if (zoomState.scale === 1) {
            zoomState.translateX = 0;
            zoomState.translateY = 0;
        }

        applyViewportTransform();
    }

    function translatePointToMap(clientX, clientY, stage, overlay) {
        const rect = stage.getBoundingClientRect();
        const viewBox = overlay.viewBox.baseVal;
        const baseX = clientX - rect.left;
        const baseY = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const unscaledX = centerX + ((baseX - zoomState.translateX - centerX) / zoomState.scale);
        const unscaledY = centerY + ((baseY - zoomState.translateY - centerY) / zoomState.scale);
        const ratioX = viewBox.width / rect.width;
        const ratioY = viewBox.height / rect.height;

        return {
            x: Number((unscaledX * ratioX).toFixed(2)),
            y: Number((unscaledY * ratioY).toFixed(2)),
        };
    }

    function bindZoomControls() {
        const zoomIn = document.getElementById(zoomInId);
        const zoomOut = document.getElementById(zoomOutId);
        const zoomReset = document.getElementById(zoomResetId);

        if (zoomIn && zoomIn.dataset.mapTrackerBound !== 'true') {
            zoomIn.addEventListener('click', function () {
                setZoom(zoomState.scale + zoomStep);
            });
            zoomIn.dataset.mapTrackerBound = 'true';
        }

        if (zoomOut && zoomOut.dataset.mapTrackerBound !== 'true') {
            zoomOut.addEventListener('click', function () {
                setZoom(zoomState.scale - zoomStep);
            });
            zoomOut.dataset.mapTrackerBound = 'true';
        }

        if (zoomReset && zoomReset.dataset.mapTrackerBound !== 'true') {
            zoomReset.addEventListener('click', function () {
                setZoom(1);
            });
            zoomReset.dataset.mapTrackerBound = 'true';
        }
    }

    function bindStageInteractions() {
        const stage = getStage();

        if (!stage || stage.dataset.mapTrackerBound === 'true') {
            return;
        }

        stage.addEventListener('click', function (event) {
            const state = parseState();
            const selectionMode = isSelectionMode(state);

            if (!selectionMode || typeof Livewire === 'undefined') {
                zoomState.moved = false;
                return;
            }

            zoomState.pointerId = null;
            zoomState.moved = false;

            const overlay = document.getElementById(overlayId);

            if (!overlay) {
                return;
            }

            const mappedPoint = translatePointToMap(event.clientX, event.clientY, stage, overlay);
            const eventName = state.awaitingLandmarkPlacement ? 'map-tracker-landmark' : 'map-tracker-align';

            Livewire.dispatch(eventName, {
                mapX: mappedPoint.x,
                mapY: mappedPoint.y,
            });
        });

        stage.addEventListener('wheel', function (event) {
            event.preventDefault();

            if (event.deltaY < 0) {
                setZoom(zoomState.scale + zoomStep);
                return;
            }

            setZoom(zoomState.scale - zoomStep);
        }, { passive: false });

        stage.addEventListener('pointerdown', function (event) {
            const state = parseState();

            if (isSelectionMode(state) || zoomState.scale <= 1) {
                return;
            }

            zoomState.pointerId = event.pointerId;
            zoomState.lastX = event.clientX;
            zoomState.lastY = event.clientY;
            zoomState.moved = false;
            stage.setPointerCapture(event.pointerId);
            updateStageCursor(stage, state);
        });

        stage.addEventListener('pointermove', function (event) {
            if (zoomState.pointerId !== event.pointerId) {
                return;
            }

            const deltaX = event.clientX - zoomState.lastX;
            const deltaY = event.clientY - zoomState.lastY;

            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                zoomState.moved = true;
            }

            zoomState.translateX += deltaX;
            zoomState.translateY += deltaY;
            zoomState.lastX = event.clientX;
            zoomState.lastY = event.clientY;
            applyViewportTransform();
        });

        const releasePointer = function (event) {
            if (zoomState.pointerId !== event.pointerId) {
                return;
            }

            stage.releasePointerCapture(event.pointerId);
            zoomState.pointerId = null;
            updateStageCursor(stage, parseState());
        };

        stage.addEventListener('pointerup', releasePointer);
        stage.addEventListener('pointercancel', releasePointer);
        stage.addEventListener('pointerleave', function () {
            if (zoomState.pointerId === null) {
                updateStageCursor(stage, parseState());
            }
        });

        stage.dataset.mapTrackerBound = 'true';
    }

    function renderTrackedPlayer(overlay, player) {
        const color = typeof player?.color === 'string' && player.color !== '' ? player.color : '#38bdf8';
        const points = buildTrackedPlayerPoints(player);

        if (points.length > 1) {
            overlay.appendChild(createSvgNode('polyline', {
                points: points.map(function (point) {
                    return point.x + ',' + point.y;
                }).join(' '),
                fill: 'none',
                stroke: color,
                'stroke-width': 4,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                opacity: 0.95,
            }));
        }

        normalizePoints(player?.stops).forEach(function (point) {
            overlay.appendChild(createSvgNode('circle', {
                cx: point.x,
                cy: point.y,
                r: 4,
                fill: color,
                opacity: 0.28,
                stroke: color,
                'stroke-width': 1.5,
            }));
        });

        const currentPoint = player?.currentPoint;

        if (typeof currentPoint?.x !== 'number' || typeof currentPoint?.y !== 'number') {
            return;
        }

        overlay.appendChild(createSvgNode('circle', {
            cx: currentPoint.x,
            cy: currentPoint.y,
            r: 11,
            fill: color,
            opacity: 0.18,
        }));

        overlay.appendChild(createSvgNode('circle', {
            cx: currentPoint.x,
            cy: currentPoint.y,
            r: 5,
            fill: color,
            stroke: '#f8fafc',
            'stroke-width': 1.5,
        }));
    }

    function renderSinglePlayer(overlay, state) {
        const points = buildPoints(state);

        if (points.length > 1) {
            overlay.appendChild(createSvgNode('polyline', {
                points: points.map(function (point) {
                    return point.x + ',' + point.y;
                }).join(' '),
                class: 'map-track-line',
            }));
        }

        normalizePoints(state?.stops).forEach(function (point) {
            overlay.appendChild(createSvgNode('circle', {
                cx: point.x,
                cy: point.y,
                r: 4,
                class: 'map-track-stop',
            }));
        });

        const currentPoint = state?.currentPoint;

        if (typeof currentPoint?.x !== 'number' || typeof currentPoint?.y !== 'number') {
            return;
        }

        overlay.appendChild(createSvgNode('circle', {
            cx: currentPoint.x,
            cy: currentPoint.y,
            r: 11,
            class: 'map-track-pulse',
        }));

        overlay.appendChild(createSvgNode('circle', {
            cx: currentPoint.x,
            cy: currentPoint.y,
            r: 5,
            class: 'map-track-marker',
        }));
    }

    function render() {
        const state = parseState();
        const overlay = document.getElementById(overlayId);
        const image = document.getElementById(imageId);
        const emptyState = document.getElementById(emptyId);
        const stage = getStage();

        if (!state || !overlay) {
            return;
        }

        toggleEmptyState(image, emptyState);
        bindZoomControls();
        bindStageInteractions();

        if (isSelectionMode(state)) {
            zoomState.pointerId = null;
            zoomState.moved = false;
        }

        applyViewportTransform();
        updateStageCursor(stage, state);

        while (overlay.firstChild) {
            overlay.removeChild(overlay.firstChild);
        }

        const trackedPlayers = getTrackedPlayers(state);

        if (trackedPlayers.length > 0) {
            trackedPlayers.forEach(function (player) {
                renderTrackedPlayer(overlay, player);
            });

            return;
        }

        renderSinglePlayer(overlay, state);
    }

    function scheduleRender() {
        window.requestAnimationFrame(render);
    }

    document.addEventListener('DOMContentLoaded', scheduleRender);
    document.addEventListener('livewire:navigated', scheduleRender);
    document.addEventListener('livewire:init', function () {
        if (typeof Livewire === 'undefined') {
            return;
        }

        Livewire.on('mapTrackerUpdated', function () {
            scheduleRender();
        });
    });
})();

