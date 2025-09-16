export default async function handler(req, res) {
    const { code, error } = req.query;

    if (error) {
        return res.redirect('/cms/products?error=' + encodeURIComponent(error));
    }

    if (!code) {
        return res.redirect('/cms/products?error=no_code');
    }

    return res.redirect(`/cms/products?code=${code}`);
}