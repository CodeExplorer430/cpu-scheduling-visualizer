import React from 'react';
import { AboutHero } from '../components/about/AboutHero';
import { AboutMission } from '../components/about/AboutMission';
import { FeaturesGrid } from '../components/about/FeaturesGrid';
import { AlgorithmList } from '../components/about/AlgorithmList';
import { AboutAuthor } from '../components/about/AboutAuthor';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <AboutHero />
      <AboutMission />
      <FeaturesGrid />
      <AlgorithmList />
      <AboutAuthor />
    </div>
  );
};