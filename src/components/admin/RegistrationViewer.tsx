'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Registration } from '@/types';

interface RegistrationViewerProps {
  userId: string;
}

export function RegistrationViewer({ userId }: RegistrationViewerProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegistration();
  }, [userId]);

  const fetchRegistration = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/registration`);
      const data = await response.json();

      if (response.ok) {
        setRegistration(data.registration);
      } else {
        setError(data.error || 'Kon registratiegegevens niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch registration:', err);
      setError('Netwerkfout bij ophalen registratie');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-3" />
        <p className="text-cream/70 text-sm">Registratie laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-warm-red/20 border border-warm-red rounded-lg">
        <p className="text-sm text-warm-red">{error}</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="p-4 bg-cream/10 border border-cream/20 rounded-lg text-center">
        <p className="text-cream/50 text-sm">Geen registratiegegevens gevonden</p>
      </div>
    );
  }

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="mb-4">
      <h5 className="text-gold font-semibold text-sm mb-2">{title}</h5>
      <div className="pl-3 border-l-2 border-gold/20 space-y-2">{content}</div>
    </div>
  );

  const renderField = (label: string, value: string | number | boolean | undefined | null) => {
    if (value === undefined || value === null || value === '') return null;

    return (
      <div className="text-sm">
        <span className="text-cream/60">{label}: </span>
        <span className="text-cream">{String(value)}</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Personal Info */}
      {renderSection(
        'Persoonlijke gegevens',
        <>
          {renderField('Naam', registration.name)}
          {renderField('Email', registration.email)}
          {renderField('Geboortejaar', registration.birth_year)}
          {renderField('Partner', registration.has_partner ? 'Ja' : 'Nee')}
          {registration.has_partner && renderField('Partnernaam', registration.partner_name)}
          {renderField('Dieetwensen', registration.dietary_requirements)}
        </>
      )}

      {/* Skills */}
      {renderSection(
        'Vaardigheden',
        <>
          {renderField('Primaire vaardigheid', registration.primary_skill)}
          {renderField('Extra vaardigheden', registration.additional_skills)}
        </>
      )}

      {/* Music Preferences */}
      {renderSection(
        'Muziekvoorkeuren',
        <>
          {renderField('Favoriete decade', registration.music_decade)}
          {renderField('Favoriete genre', registration.music_genre)}
        </>
      )}

      {/* Quiz Answers */}
      {registration.quiz_answers && Object.keys(registration.quiz_answers).length > 0 && (
        renderSection(
          'Quiz antwoorden',
          <div className="space-y-3">
            {Object.entries(registration.quiz_answers).map(([key, value]) => {
              if (!value) return null;

              const labels: Record<string, string> = {
                guiltyPleasureSong: 'Guilty pleasure song',
                bestConcert: 'Beste concert',
                movieByHeart: 'Film uit het hoofd',
                secretSeries: 'Geheime serie',
                weirdestFood: 'Raarste eten',
                signatureDish: 'Signature dish',
                foodRefusal: 'Eten weigering',
                childhoodNickname: 'Kinderbijnaam',
                childhoodDream: 'Kinderdroom',
                firstCar: 'Eerste auto',
                hiddenTalent: 'Verborgen talent',
                irrationalFear: 'Irrationele angst',
                bucketList: 'Bucketlist',
                bestJKMoment: 'Beste JK moment',
                longestKnownMember: 'Langst gekende lid',
              };

              return (
                <div key={key} className="bg-deep-green/30 p-3 rounded-lg">
                  <div className="text-gold text-xs font-semibold mb-1">
                    {labels[key] || key}
                  </div>
                  <div className="text-cream text-sm">{value}</div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* AI Assignment */}
      {registration.ai_assignment && renderSection(
        'AI Taak toewijzing',
        <div className="bg-deep-green/30 p-4 rounded-lg space-y-2">
          <div>
            <span className="text-gold text-xs font-semibold">Titel: </span>
            <span className="text-cream text-sm">{registration.ai_assignment.officialTitle}</span>
          </div>
          <div>
            <span className="text-gold text-xs font-semibold">Taak: </span>
            <span className="text-cream text-sm">{registration.ai_assignment.task}</span>
          </div>
          <div>
            <span className="text-gold text-xs font-semibold">Redenering: </span>
            <span className="text-cream/70 text-sm italic">{registration.ai_assignment.reasoning}</span>
          </div>
          <div>
            <span className="text-gold text-xs font-semibold">Waarschuwingsniveau: </span>
            <span className={`text-sm font-bold ${
              registration.ai_assignment.warningLevel === 'ROOD' ? 'text-warm-red' :
              registration.ai_assignment.warningLevel === 'ORANJE' ? 'text-orange-400' :
              registration.ai_assignment.warningLevel === 'GEEL' ? 'text-yellow-400' :
              'text-success-green'
            }`}>
              {registration.ai_assignment.warningLevel}
            </span>
          </div>
          {registration.ai_assignment.specialPrivilege && (
            <div>
              <span className="text-gold text-xs font-semibold">Speciaal privilege: </span>
              <span className="text-cream text-sm">{registration.ai_assignment.specialPrivilege}</span>
            </div>
          )}
        </div>
      )}

      {/* Predictions */}
      {registration.predictions && Object.keys(registration.predictions).length > 0 && (
        renderSection(
          'Voorspellingen',
          <div className="space-y-2">
            {registration.predictions.wineBottles !== undefined &&
              renderField('Flessen wijn', registration.predictions.wineBottles)}
            {registration.predictions.beerCrates !== undefined &&
              renderField('Kratten bier', registration.predictions.beerCrates)}
            {registration.predictions.meatKilos !== undefined &&
              renderField('Kilo vlees', registration.predictions.meatKilos)}
            {renderField('Eerste slaper', registration.predictions.firstSleeper)}
            {renderField('Spontane zanger', registration.predictions.spontaneousSinger)}
            {renderField('Eerste vertrekker', registration.predictions.firstToLeave)}
            {renderField('Laatste vertrekker', registration.predictions.lastToLeave)}
            {renderField('Luidste lacher', registration.predictions.loudestLaugher)}
            {renderField('Langste verhalenverteller', registration.predictions.longestStoryTeller)}
            {registration.predictions.somethingBurned !== undefined &&
              renderField('Iets aangebrand', registration.predictions.somethingBurned ? 'Ja' : 'Nee')}
            {registration.predictions.outsideTemp !== undefined &&
              renderField('Buitentemperatuur', `${registration.predictions.outsideTemp}°C`)}
            {registration.predictions.lastGuestTime !== undefined &&
              renderField('Laatste gast tijd', registration.predictions.lastGuestTime)}
          </div>
        )
      )}

      {/* Meta info */}
      <div className="pt-4 border-t border-gold/10 text-xs text-cream/50 space-y-1">
        <div>Geregistreerd: {new Date(registration.created_at).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</div>
        <div>Laatst bijgewerkt: {new Date(registration.updated_at).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</div>
        <div>Status: {registration.is_complete ? 'Compleet' : 'Incompleet'}</div>
        <div>Huidige stap: {registration.current_step}</div>
      </div>
    </motion.div>
  );
}
