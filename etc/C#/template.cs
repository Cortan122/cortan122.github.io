using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/// <summary>
/// Задание с Контрольной Работы №4
/// </summary>
/// <remarks>
/// <para>Дата: 06.06.2020</para>
/// <para>Вариант: 0</para>
/// </remarks>
namespace Шаблон {
  class Program {
    /// <summary>
    /// Считавыет целое число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static int ReadInt(string name, int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      int r;
      do {
        string tempstr1 = lowerBound != int.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != int.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}int{tempstr2}): ");
      } while (!int.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    /// <summary>
    /// Считавыет символ с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если символ неправильный, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенный символ.
    /// </returns>
    /// <param name="name">Название этого символа.</param>
    /// <param name="lowerBound">Минимально возможное значение символа.</param>
    /// <param name="upperBound">Максимально возможное значение символа.</param>
    static char ReadChar(string name, char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      char r;
      do {
        string tempstr1 = lowerBound != char.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != char.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}char{tempstr2}): ");
      } while (!char.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    /// <summary>
    /// Считавыет действительное число с stdin, и проверяет попадает ли оно в отрезок [lowerBound,upperBound].
    /// Если число неправильное, просит ввести его повторно.
    /// </summary>
    /// <returns>
    /// Введенное число.
    /// </returns>
    /// <param name="name">Название этого числа.</param>
    /// <param name="lowerBound">Минимально возможное значение числа.</param>
    /// <param name="upperBound">Максимально возможное значение числа.</param>
    static double ReadDouble(string name, double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      double r;
      do {
        string tempstr1 = lowerBound != double.MinValue? lowerBound + " <= ": "";
        string tempstr2 = upperBound != double.MaxValue? " <= " + upperBound: "";
        Console.Write($"Введите {name} ({tempstr1}double{tempstr2}): ");
      } while (!double.TryParse(Console.ReadLine(), out r) || r < lowerBound || r > upperBound);
      return r;
    }

    // Перегрузка наслучай, если нет name.
    static int ReadInt(int lowerBound = int.MinValue, int upperBound = int.MaxValue) {
      return ReadInt("целое число", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static char ReadChar(char lowerBound = char.MinValue, char upperBound = char.MaxValue) {
      return ReadChar("символ", lowerBound, upperBound);
    }

    // Перегрузка наслучай, если нет name.
    static double ReadDouble(double lowerBound = double.MinValue, double upperBound = double.MaxValue) {
      return ReadDouble("действительное число", lowerBound, upperBound);
    }

    /// <summary>
    /// Запускает f() и предлогает пользователю повторить.
    /// В Console.ReadKey он игнорирует клавиши модификаторы
    /// </summary>
    static void Loop(Action f) {
      while (true) {
        try {
          f();
        } catch (Exception e) {
          Console.ForegroundColor = ConsoleColor.DarkRed;
          Console.WriteLine($"поизашёл эксепшен: {e.Message}");
          Console.ResetColor();
        }
        // if Console.IsOutputRedirected is True Console.ReadKey() throws an exeption
        if (Console.IsOutputRedirected)return;
        Console.WriteLine("Нажмите Enter чтобы повторить");

        // тут мы игнорируем нажатия на winkey и fn, чтобы можно было брать скрины через Win+Shift+S
        ConsoleKey theKey = ConsoleKey.LeftWindows;
        while (
          theKey == ConsoleKey.LeftWindows ||
          theKey == ConsoleKey.RightWindows ||
          theKey == (ConsoleKey)255 // это fn (у меня)
        ) {
          theKey = Console.ReadKey(true).Key;
        }

        if (theKey != ConsoleKey.Enter)break;
        Console.Clear(); // мне так посоветовал сделать Сагалов
      }
    }

    /// <summary>
    /// Открывает текстовый файл, считывает весь текст файла в строку и затем закрывает файл.
    /// если неполучилось возвращает null
    /// </summary>
    /// <param name="file">The file to open for reading.</param>
    /// <returns>A string containing all lines of the file.</returns>
    static string TryReadAllText(string path) {
      try {
        return File.ReadAllText(path);
      } catch (FileNotFoundException) {
        Console.WriteLine("Файл не существует");
      } catch (IOException) {
        Console.WriteLine("Ошибка ввода-вывода");
      } catch (System.Security.SecurityException) {
        Console.WriteLine("Ошибка безопасности");
      } catch (UnauthorizedAccessException) {
        Console.WriteLine("У вас нет разрешения на создание/чтение файла");
      }
      return null;
    }

    /// <summary>
    /// Creates a new file, writes the specified string to the file, and then closes the file.
    /// If the target file already exists, it is overwritten.
    /// If we faild to write to this file returns false, else returns true.
    /// </summary>
    /// <returns>удолось ли нам записать в файл</returns>
    /// <param name="encoding">The encoding to apply to the string.</param>
    /// <param name="path">The file to write to.</param>
    /// <param name="text">The string to write to the file.</param>
    static bool TryWriteAllText(string path, string text, Encoding encoding = null) {
      if (encoding == null)encoding = new UTF8Encoding(true);
      try {
        File.WriteAllText(path, text, encoding);
        return true;
      } catch (FileNotFoundException) {
        Console.WriteLine($"Файл не существует (имя файла = {path})");
      } catch (IOException) {
        Console.WriteLine($"Ошибка ввода-вывода (имя файла = {path})");
      } catch (System.Security.SecurityException) {
        Console.WriteLine($"Ошибка безопасности (имя файла = {path})");
      } catch (UnauthorizedAccessException) {
        Console.WriteLine($"У вас нет разрешения на чтение файла (имя файла = {path})");
      }
      return false;
    }

    static Random rng = new Random();

    /// <summary>
    /// генерирует рандомный дабл в промежутке
    /// </summary>
    /// <param name="minimum">минимальное возможное значение дабла</param>
    /// <param name="maximum">максимальное возможное значение дабла</param>
    /// <returns>сгенирированый дабл</returns>
    static double RandomDouble(double minimum, double maximum) {
      return rng.NextDouble() * (maximum - minimum) + minimum;
    }

    static void Main() {
      Loop(() => {
        var n = ReadInt(1, 1000);
        // your code goes here
      });
    }
  }
}
