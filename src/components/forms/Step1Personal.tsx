'use client';

import { useRegistrationStore } from '@/lib/store';
import { Input, Select, Checkbox, TextArea, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { BIRTH_YEARS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export function Step1Personal() {
  const { formData, setFormData, nextStep } = useRegistrationStore();

  const birthYearOptions = BIRTH_YEARS.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const isValid =
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.birthYear !== null &&
    (!formData.hasPartner || formData.partnerName.trim() !== '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Persoonlijke Gegevens</CardTitle>
          <CardDescription>
            Identificeer uzelf voor de commissie
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Input
              label="Volledige naam"
              placeholder="Uw volledige naam"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              required
            />

            <Input
              label="E-mailadres"
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={formData.email}
              onChange={(e) => setFormData({ email: e.target.value })}
              required
            />

            <Select
              label="Geboortejaar"
              options={birthYearOptions}
              placeholder="Selecteer uw geboortejaar"
              value={formData.birthYear?.toString() || ''}
              onChange={(e) =>
                setFormData({ birthYear: parseInt(e.target.value, 10) })
              }
              required
            />

            <div className="pt-4 border-t border-gold/10">
              <Checkbox
                label="Ik breng een partner mee"
                description="Indien van toepassing"
                checked={formData.hasPartner}
                onChange={(e) =>
                  setFormData({
                    hasPartner: e.target.checked,
                    partnerName: e.target.checked ? formData.partnerName : '',
                  })
                }
              />

              <AnimatePresence>
                {formData.hasPartner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden"
                  >
                    <Input
                      label="Naam partner"
                      placeholder="Naam van uw partner"
                      value={formData.partnerName}
                      onChange={(e) =>
                        setFormData({ partnerName: e.target.value })
                      }
                      required={formData.hasPartner}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <TextArea
              label="Dieetwensen"
              placeholder="Vegetarisch, allergieën, etc. (optioneel)"
              value={formData.dietaryRequirements}
              onChange={(e) =>
                setFormData({ dietaryRequirements: e.target.value })
              }
              hint="Laat leeg indien niet van toepassing"
            />
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!isValid}>
              Volgende stap
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
