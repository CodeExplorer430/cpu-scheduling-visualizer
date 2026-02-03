import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  image?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  type = 'website',
  name = 'Quantix',
  image = '/logo.png',
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentLanguage = i18n.language;

  // Base URL (assuming production URL, update if known)
  const baseUrl = 'https://quantix-cpu.vercel.app';
  const canonicalUrl = `${baseUrl}${location.pathname}`;

  // Get localized strings from the seo block
  // We use the pathname to determine which SEO keys to use
  const path = location.pathname === '/' ? 'home' : location.pathname.split('/')[1];
  const defaultTitle = t(`seo.${path}.title`, { defaultValue: t('seo.home.title') });
  const defaultDescription = t(`seo.${path}.description`, {
    defaultValue: t('seo.defaultDescription'),
  });

  const seoTitle = title ? `${title} | ${name}` : defaultTitle;
  const seoDescription = description || defaultDescription;

  // Keywords for the application
  const keywords = [
    'CPU scheduling',
    'algorithm visualizer',
    'operating systems',
    'process scheduling',
    'FCFS',
    'Round Robin',
    'SJF',
    'SRTF',
    'MLFQ',
    'Gantt chart',
    'computer science education',
    'interactive simulation',
    'quantix',
  ].join(', ');

  // Breadcrumb Structured Data
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      ...(location.pathname !== '/'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: seoTitle.split('|')[0].trim(),
              item: canonicalUrl,
            },
          ]
        : []),
    ],
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <html lang={currentLanguage} dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} />

      {/* Open Graph / Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={name} />
      <meta property="og:image" content={`${baseUrl}${image}`} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content="@quantix" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={`${baseUrl}${image}`} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">{JSON.stringify(breadcrumbList)}</script>

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: name,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          url: baseUrl,
          description: t('seo.defaultDescription'),
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        })}
      </script>

      {location.pathname === '/guide' && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to use Quantix CPU Visualizer',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Define Processes',
                text: 'Add your processes with PID, Arrival, and Burst times in the process table.',
              },
              {
                '@type': 'HowToStep',
                name: 'Choose Algorithm',
                text: 'Select one of the 11 supported scheduling algorithms like Round Robin or MLFQ.',
              },
              {
                '@type': 'HowToStep',
                name: 'Run & Analyze',
                text: 'Start the simulation and use the Gantt chart to analyze the execution flow.',
              },
            ],
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
