import { useAppSelector } from "./hooks";

function DragGuideIcon(): JSX.Element {
  const baseHue = useAppSelector((state) => state.color.hue);

  return (
    <svg
      viewBox="0 0 512 512"
    >
      <path
        d="M140.554,342.052L156.154,369.072L90.585,351.503L108.154,285.933L123.754,312.953L373.169,168.953L357.569,141.933L423.138,159.503L405.569,225.072L389.969,198.052L140.554,342.052Z"
        fill="url(#_Lightness)"
      />
      <path
        d="M239.2,112L208,112L256,64L304,112L272.8,112L272.8,400L304,400L256,448L208,400L239.2,400L239.2,112Z"
        fill="url(#_Saturation)"
      />
      <path
        d="M126.108,200.406L110.508,227.426L92.939,161.856L158.508,144.287L142.908,171.307L392.323,315.307L407.923,288.287L425.492,353.856L359.923,371.426L375.523,344.406L126.108,200.406Z"
        fill="url(#_Hue)"
      />
      <defs>
        <linearGradient
          id="_Lightness"
          x1="1"
          y1="0"
          x2="0"
          y2="0"
          gradientTransform="rotate(-30 0.5 0.5)"
        >
          <stop
            offset="0"
            style={{"stopColor": `hsl(${baseHue},70%,0%)`}}
          />
          <stop
            offset="0.5"
            style={{"stopColor": `hsl(${baseHue},70%,50%)`}}
          />
          <stop
            offset="1"
            style={{"stopColor": `hsl(${baseHue},70%,100%)`}}
          />
        </linearGradient>
        <linearGradient
          id="_Hue"
          x1="1" 
          y1="0" 
          x2="0" 
          y2="0" 
          gradientTransform="rotate(30 0.5 0.5)"
        >
          <stop
            offset="0"
            style={{"stopColor": `hsl(${baseHue - 120},70%,50%)`}}
          />
          <stop
            offset="0.25"
            style={{"stopColor": `hsl(${baseHue - 60},70%,50%)`}}
          />
          <stop
            offset="0.5"
            style={{"stopColor": `hsl(${baseHue},70%,50%)`}}
          />
          <stop
            offset="0.75"
            style={{"stopColor": `hsl(${baseHue + 60},70%,50%)`}}
          />
          <stop
            offset="1"
            style={{"stopColor": `hsl(${baseHue + 120},70%,50%)`}}
          />
        </linearGradient>
        <linearGradient
          id="_Saturation"
          x1="1"
          y1="0"
          x2="0"
          y2="0"
          gradientTransform="rotate(-90 0.5 0.5)"
        >
          <stop
            offset="0"
            style={{"stopColor": `hsl(${baseHue},0%,50%)`}}
          />
          <stop
            offset="0.5"
            style={{"stopColor": `hsl(${baseHue},50%,50%)`}}
          />
          <stop
            offset="1"
            style={{"stopColor": `hsl(${baseHue},100%,50%)`}}
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default DragGuideIcon;
