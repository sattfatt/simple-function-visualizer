const mapRange = (num, min_old, max_old, min_new, max_new) => {
    return (num - min_old) * (max_new - min_new) / (max_old - min_old) + min_new;
}

export default mapRange;