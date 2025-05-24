import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

type Aggregated = { key: string; amount: number };

interface ComparisonViewProps {
  dataA: Aggregated[];
  dataB: Aggregated[];
  scaleToOne: boolean;
}

const Container = styled.div`
  display: flex;
  gap: 16px;
`;
const Panel = styled.div`
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
`;
const Label = styled.div`
  width: 100px;
`;
const Bar = styled.div<{ width: number }>`
  height: 20px;
  background-color: #69b3a2;
  width: ${props => props.width}px;
`;

const ComparisonView: React.FC<ComparisonViewProps> = ({ dataA, dataB, scaleToOne }) => {
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);

  // find max value for scaling
  const maxA = Math.max(...dataA.map(d => d.amount), 0);
  const maxB = Math.max(...dataB.map(d => d.amount), 0);
  const scaleFactor = scaleToOne && maxA > 0 ? maxA / maxB : 1;

  // sync scroll
  useEffect(() => {
    const a = panelARef.current;
    const b = panelBRef.current;
    if (!a || !b) return;
    const sync = () => { if (b.scrollTop !== a.scrollTop) b.scrollTop = a.scrollTop; };
    a.addEventListener('scroll', sync);
    return () => { a.removeEventListener('scroll', sync); };
  }, []);

  return (
    <Container>
      <Panel ref={panelARef}>
        {dataA.map(d => (
          <Row key={d.key}>
            <Label>{d.key}</Label>
            <Bar width={(d.amount / maxA) * 200} />
          </Row>
        ))}
      </Panel>
      <Panel ref={panelBRef}>
        {dataB.map(d => (
          <Row key={d.key}>
            <Label>{d.key}</Label>
            <Bar width={((d.amount * scaleFactor) / maxA) * 200} />
          </Row>
        ))}
      </Panel>
    </Container>
  );
};

export default ComparisonView;
