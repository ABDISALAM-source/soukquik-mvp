import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { RatingStars } from './RatingStars';
import { Button } from './Button';
import { useSession } from '../store/session';
import * as reviewsApi from '../api/reviews';
import { Review } from '../api/reviews';

interface ReviewSectionProps {
  targetType: 'shop' | 'service' | 'product';
  targetId: string;
  /** Permet à l'écran parent de réutiliser la moyenne/le compteur (ex: dans un en-tête de stats) sans refaire l'appel réseau. */
  onSummaryChange?: (summary: { count: number; average: number }) => void;
}

/**
 * Bloc avis auto-suffisant (récupère et affiche ses propres données) :
 * liste des avis + moyenne, formulaire pour en laisser un, remplacé par
 * "déjà noté" si l'utilisateur courant a déjà un avis sur cette cible.
 * Réutilisé par ShopScreen (Phase 3) et ServiceScreen (Phase 7).
 */
export function ReviewSection({ targetType, targetId, onSummaryChange }: ReviewSectionProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const { user } = useSession();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  // Notes détaillées optionnelles (Phase 10) : 0 = non renseignée.
  const [rQuality, setRQuality] = useState(0);
  const [rValue, setRValue] = useState(0);
  const [rPunctuality, setRPunctuality] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refresh();
  }, [targetType, targetId]);

  function refresh() {
    reviewsApi.fetchReviews(targetType, targetId).then((r) => {
      setReviews(r.reviews);
      setSummary(r.summary);
      onSummaryChange?.(r.summary);
    }).catch(() => {});
  }

  async function submitReview() {
    if (newRating === 0) {
      Alert.alert('Note requise', 'Choisis une note de 1 à 5 étoiles.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.createReview({
        targetType,
        targetId,
        rating: newRating,
        comment: newComment || undefined,
        ratingQuality: rQuality || undefined,
        ratingValue: rValue || undefined,
        ratingPunctuality: rPunctuality || undefined,
      });
      setNewRating(0);
      setNewComment('');
      setRQuality(0);
      setRValue(0);
      setRPunctuality(0);
      refresh();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const myReview = reviews.find((r) => r.authorId === user?.id);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Avis ({summary.count})</Text>

      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>Aucun avis pour le moment.</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{r.authorName}</Text>
              <RatingStars rating={r.rating} size={11} />
            </View>
            {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
          </View>
        ))
      )}

      {myReview ? (
        <Text style={styles.alreadyReviewed}>Tu as déjà laissé un avis ici.</Text>
      ) : (
        <View style={styles.reviewForm}>
          <Text style={styles.reviewFormLabel}>Laisser un avis</Text>
          <RatingStars rating={newRating} size={22} onChange={setNewRating} />

          {/* Notes détaillées (optionnelles) */}
          <Text style={styles.detailHint}>Détaille ton avis (facultatif)</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Qualité</Text>
            <RatingStars rating={rQuality} size={16} onChange={setRQuality} />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rapport qualité-prix</Text>
            <RatingStars rating={rValue} size={16} onChange={setRValue} />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ponctualité</Text>
            <RatingStars rating={rPunctuality} size={16} onChange={setRPunctuality} />
          </View>

          <TextInput
            style={styles.reviewInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Ton commentaire (optionnel)"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Button label="Publier l'avis" onPress={submitReview} loading={submitting} />
        </View>
      )}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number; md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    section: { paddingHorizontal: spacing.lg - 4, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    sectionTitle: {
      fontSize: typography.size.lg - 3,
      fontFamily: typography.fontFamily.heading,
      color: theme.text,
      marginBottom: 12,
    },
    noReviews: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted },
    reviewCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm + 4,
      marginBottom: spacing.sm,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthor: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    reviewComment: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 6 },
    alreadyReviewed: {
      fontSize: typography.size.xs + 1,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
    reviewForm: { marginTop: spacing.md, gap: spacing.sm },
    reviewFormLabel: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    detailHint: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: spacing.xs },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailLabel: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.text },
    reviewInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      padding: spacing.sm + 4,
      minHeight: 70,
      textAlignVertical: 'top',
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
  });
}
