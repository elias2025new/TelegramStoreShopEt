import React from 'react';
import { Composition } from 'remotion';
import { HowToPay } from './HowToPay';
import '../app/globals.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="HowToPay"
                component={HowToPay}
                durationInFrames={800}
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
