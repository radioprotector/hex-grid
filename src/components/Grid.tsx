import { useMemo } from "react";
import { Hex } from "honeycomb-grid";

import { useAppSelector } from "../hooks";
import { selectGridHexes } from "../state/hexGridSlice";

import Cell from './Cell';

/**
 * Generates a key for the provided hex element.
 * @param hex The hex element.
 * @returns The key for the hex.
 */
 function hexToKey(hex: Hex<any>): string {
  // Use the QRS cubic coordinates to map this
  return `${hex.q}~${hex.r}~${hex.s}`;
}

function Grid(): JSX.Element {
  const screenDimensions = useAppSelector((state) => state.hexGrid.screenDimensions);
  const gridDimensions = useAppSelector((state) => state.hexGrid.gridDimensions);
  const cellDimensions = useAppSelector((state) => state.hexGrid.cellDimensions);
  const centerCoord = useAppSelector((state) => state.hexGrid.centerCoord);
  const baseHexSize = useAppSelector((state) => state.hexGrid.baseHexSize);

  // Map each cell to a discrete component.
  const cellHexes = useMemo(
    () => {
      return selectGridHexes(gridDimensions, centerCoord, baseHexSize);
    },
    [gridDimensions, centerCoord, baseHexSize]);

  const cellElements = useMemo(
    () => {
      return cellHexes.map((hex) => {
          return <Cell
            key={hexToKey(hex)}
            hex={hex}
          />
        });
    },
    [cellHexes]);

  // The center hex element will be last in the collection.
  // Shift the SVG up and to the left until the center of that hex matches the center of the screen.
  const centerHexPoint = cellHexes[cellHexes.length - 1].toPoint();
  let verticalOffset = (screenDimensions.height / 2) - centerHexPoint.y - (cellDimensions.height / 2);
  let horizontalOffset = (screenDimensions.width / 2) - centerHexPoint.x - (cellDimensions.width / 2);

  const style: React.CSSProperties = {
    position: 'relative' as const,
    left: horizontalOffset,
    top: verticalOffset,
    overflow: 'visible',
    userSelect: 'none'
  };

  return (
    <svg
      style={style}
    >
      {cellElements}
    </svg>
  );
}

export default Grid;
