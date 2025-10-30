<script lang="ts">
  interface Props {
    active: boolean;
    seconds: number;
  }

  const { active, seconds }: Props = $props();
</script>

<svg
  width="140"
  height="50"
  viewBox="0 0 140 50"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  role="img"
  class:active
  class="absolute top-1/2 left-4"
>
  <style>
    .badge-text {
      font-family:
        Inter,
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial;
      font-weight: 700;
      font-size: 28px;
      fill: white;
      paint-order: stroke;
      stroke: rgba(0, 0, 0, 0.25);
      stroke-width: 0.8px;
      alignment-baseline: central;
      opacity: 0;
    }

    .active .badge-text {
      animation: textPopFade 800ms ease-in-out forwards;
    }

    .chev {
      fill: none;
      stroke: white;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
    }

    /* arrow slide animation: translate on X and fade */
    @keyframes slideRight {
      0% {
        transform: translateX(0);
        opacity: 0.65;
      }
      30% {
        opacity: 1;
      }
      60% {
        transform: translateX(-28px);
        opacity: 0;
      }
      100% {
        transform: translateX(-28px);
        opacity: 0;
      }
    }

    /* second arrow slightly faster/earlier */
    @keyframes slideRightRear {
      0% {
        transform: translateX(0);
        opacity: 0.55;
      }
      25% {
        opacity: 0.95;
      }
      60% {
        transform: translateX(-22px);
        opacity: 0;
      }
      100% {
        transform: translateX(-22px);
        opacity: 0;
      }
    }

    @keyframes textPopFade {
      0% {
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    .active .chev.front {
      animation: slideRight 900ms ease-in-out forwards;
    }

    .active .chev.rear {
      animation: slideRightRear 900ms ease-in-out forwards;
      animation-delay: 140ms;
    }

    text {
      shape-rendering: geometricPrecision;
    }
  </style>

  <g transform="translate(50,25)">
    <g class="chev rear" transform="translate(22,0)">
      <path d="M 0 -10 L -10 0 L 0 10" />
    </g>

    <g class="chev front" transform="translate(6,0)">
      <path d="M 0 -10 L -10 0 L 0 10" />
    </g>
  </g>
  <text class="badge-text" y="50%" transform="translate(60,0)">
    {Math.abs(seconds) > 1 ? `${seconds}s` : '-1FR'}</text
  >
</svg>
