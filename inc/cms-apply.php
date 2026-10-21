<?php
/**
 * Applies owner edits (overrides) to the theme templates at render time.
 * Pure string functions: with no overrides the output equals the original template.
 */
if (!defined('ABSPATH') && !defined('IB_TEST')) exit;

function ib_cms_h($s) {
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Remove the edit-key attributes. */
function ib_cms_strip($html) {
    return preg_replace('/ data-cms(?:-(?:href|src|alt|lead))?="[^"]*"/', '', $html);
}

function ib_cms_clean_rich($v) {
    if (function_exists('wp_kses')) {
        $allowed = array(
            'a' => array('href' => true, 'class' => true, 'target' => true, 'rel' => true),
            'br' => array(), 'strong' => array(), 'b' => array(), 'em' => array(), 'i' => array(),
            'u' => array(), 'small' => array(), 'sup' => array(), 'sub' => array(), 'span' => array(),
        );
        return wp_kses((string) $v, $allowed, array('http', 'https', 'mailto', 'tel'));
    }
    return (string) $v;
}

/** Find the end of the element that opens at $open_end: returns the position of its closing tag. */
function ib_cms_find_close($html, $tag, $open_end) {
    $depth = 1;
    $pos = $open_end;
    $re = '~<(/?)' . preg_quote($tag, '~') . '(?=[\s>/])[^>]*>~i';
    while (preg_match($re, $html, $m, PREG_OFFSET_CAPTURE, $pos)) {
        $pos = $m[0][1] + strlen($m[0][0]);
        if ($m[1][0] === '/') {
            $depth--;
            if ($depth === 0) return $m[0][1];
        } elseif (substr($m[0][0], -2) !== '/>') {
            $depth++;
        }
    }
    return false;
}

function ib_cms_set_attr($tag, $attr, $value) {
    $v = ib_cms_h($value);
    $re = '~(\s' . preg_quote($attr, '~') . '\s*=\s*)("[^"]*"|\'[^\']*\')~i';
    if (preg_match($re, $tag)) return preg_replace_callback($re, function ($m) use ($v) { return $m[1] . '"' . $v . '"'; }, $tag, 1);
    return preg_replace('~\s*/?>$~', ' ' . $attr . '="' . $v . '"$0', $tag, 1);
}

/** Apply one text-like key. $kind: text|rich|lead */
function ib_cms_apply_text($html, $key, $value, $kind) {
    $needle = ' data-cms="' . $key . '"';
    $offset = 0;
    while (($p = strpos($html, $needle, $offset)) !== false) {
        $ts = strrpos(substr($html, 0, $p), '<');
        if ($ts === false || !preg_match('~^<([a-zA-Z][a-zA-Z0-9]*)~', substr($html, $ts, 30), $m)) { $offset = $p + 1; continue; }
        $tag = strtolower($m[1]);
        $oe = strpos($html, '>', $p);
        if ($oe === false) break;
        $oe++;
        $cs = ib_cms_find_close($html, $tag, $oe);
        if ($cs === false) { $offset = $oe; continue; }
        $inner = substr($html, $oe, $cs - $oe);
        if ($kind === 'rich') {
            $new = ib_cms_clean_rich($value);
        } elseif ($kind === 'lead') {
            $lt = strpos($inner, '<');
            $lead = $lt === false ? $inner : substr($inner, 0, $lt);
            $rest = $lt === false ? '' : substr($inner, $lt);
            preg_match('~^(\s*)(.*?)(\s*)$~s', $lead, $w);
            $new = $w[1] . ib_cms_h($value) . $w[3] . $rest;
        } else {
            $new = ib_cms_h($value);
        }
        $html = substr($html, 0, $oe) . $new . substr($html, $cs);
        $offset = $oe + strlen($new);
    }
    return $html;
}

/** Apply an attribute key (href, src, alt). */
function ib_cms_apply_attr($html, $key, $value, $which) {
    $needle = ' data-cms-' . $which . '="' . $key . '"';
    $offset = 0;
    while (($p = strpos($html, $needle, $offset)) !== false) {
        $ts = strrpos(substr($html, 0, $p), '<');
        $te = strpos($html, '>', $p);
        if ($ts === false || $te === false) break;
        $te++;
        $tag = substr($html, $ts, $te - $ts);
        $new = ib_cms_set_attr($tag, $which, $value);
        $html = substr($html, 0, $ts) . $new . substr($html, $te);
        $offset = $ts + strlen($new);
    }
    return $html;
}

/** $over: key => value. $kinds: key => kind (from cms-defaults.json). */
function ib_cms_apply($html, array $over, array $kinds) {
    foreach ($over as $key => $value) {
        if (!isset($kinds[$key]) || strpos($html, $key) === false) continue;
        $k = $kinds[$key];
        if ($k === 'text' || $k === 'rich' || $k === 'lead') $html = ib_cms_apply_text($html, $key, $value, $k);
        elseif ($k === 'link') $html = ib_cms_apply_attr($html, $key, $value, 'href');
        elseif ($k === 'image' && substr($key, -4) === '.src') $html = ib_cms_apply_attr($html, $key, $value, 'src');
        elseif ($k === 'alt') $html = ib_cms_apply_attr($html, $key, $value, 'alt');
    }
    return ib_cms_strip($html);
}
