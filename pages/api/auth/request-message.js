export default async function handler(req, res) {
  const message = 'Please sign this message to confirm your identity.';
  res.status(200).json(message);
}
