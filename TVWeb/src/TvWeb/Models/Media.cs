namespace TvWeb.Models;

public class Film
{
    public string Slug { get; set; } = "";
    public string TitleVi { get; set; } = "";
    public string? TitleEn { get; set; }
    public string? Poster { get; set; }
    public string? Backdrop { get; set; }
    public int? Year { get; set; }
    public string? Country { get; set; }
    public string? Quality { get; set; }
    public string? Lang { get; set; }
    public double? Imdb { get; set; }
    public string? Description { get; set; }
    public string DescriptionText => System.Net.WebUtility.HtmlDecode(
        System.Text.RegularExpressions.Regex.Replace(
            System.Text.RegularExpressions.Regex.Replace(Description ?? "", @"</p\s*>", "\n\n", System.Text.RegularExpressions.RegexOptions.IgnoreCase),
            @"<p(?:\s+[^>]*)?>", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase)).Trim();
    public string? Genres { get; set; }
    public string? Directors { get; set; }
    public string? Actors { get; set; }
    public string? Duration { get; set; }
    public int? TotalEps { get; set; }
    public string? Status { get; set; }
    public string? SourceUrl { get; set; }
    public string FilmLink => $"/phim/{Slug}";
    public string? UpdatedAt { get; set; }
    public List<string> GenreList =>
        string.IsNullOrWhiteSpace(Genres) ? new() :
        System.Text.Json.JsonSerializer.Deserialize<List<string>>(Genres) ?? new();
}

public class Episode
{
    public int Id { get; set; }
    public string FilmSlug { get; set; } = "";
    public string ServerName { get; set; } = "";
    public string ServerSlug { get; set; } = "";
    public string EpIndex { get; set; } = "";
    public string? EpType { get; set; }
    public string WatchUrl { get; set; } = "";
    public string? EmbedUrl { get; set; }
    public string? M3u8Url { get; set; }
    public string? HlsUrl
    {
        get
        {
            foreach (var candidate in new[] { M3u8Url, EmbedUrl })
            {
                if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri)) continue;
                if (uri.Host.Equals("player.phimapi.com", StringComparison.OrdinalIgnoreCase))
                {
                    var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query);
                    if (!query.TryGetValue("url", out var source)
                        || !Uri.TryCreate(source.ToString(), UriKind.Absolute, out uri)) continue;
                }
                if ((uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)
                    && uri.AbsolutePath.EndsWith(".m3u8", StringComparison.OrdinalIgnoreCase))
                    return uri.AbsoluteUri;
            }
            return null;
        }
    }
    public string? PlayerUrl
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(EmbedUrl)) return EmbedUrl;
            return HlsUrl == null ? M3u8Url : null;
        }
    }
}
